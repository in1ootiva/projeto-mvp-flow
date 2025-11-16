import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Store, Product, CartItem, DeliveryZone } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function Checkout() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryBlocked, setDeliveryBlocked] = useState(false);
  const [formData, setFormData] = useState({
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    zip_code: profile?.zip_code || '',
    notes: '',
  });

  useEffect(() => {
    if (!user) {
      toast.error('Faça login para finalizar seu pedido');
      navigate('/login');
      return;
    }
    loadCheckoutData();
  }, [user, storeSlug]);

  useEffect(() => {
    if (profile) {
      setFormData({
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        notes: '',
      });
    }
  }, [profile]);

  const loadCheckoutData = async () => {
    if (!user) return;

    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!storeData) throw new Error('Loja não encontrada');
      
      setStore(storeData);

      // Load delivery zones
      const { data: zones, error: zonesError } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('store_id', storeData.id)
        .order('radius_km', { ascending: true });

      if (zonesError) throw zonesError;
      setDeliveryZones(zones || []);

      // Load cart
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', storeData.id)
        .maybeSingle();

      if (cartError) throw cartError;

      if (cart) {
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select('*, products(*)')
          .eq('cart_id', cart.id);

        if (itemsError) throw itemsError;

        if (!items || items.length === 0) {
          toast.error('Seu carrinho está vazio');
          navigate(`/${storeSlug}/carrinho`);
          return;
        }

        setCartItems(items || []);
      } else {
        toast.error('Seu carrinho está vazio');
        navigate(`/${storeSlug}/carrinho`);
      }
    } catch (error: any) {
      console.error('Error loading checkout data:', error);
      toast.error('Erro ao carregar dados do pedido');
    } finally {
      setLoading(false);
    }
  };

  // Simplified distance calculation (in real app, use a geocoding API)
  const calculateDeliveryZone = () => {
    // In a real application, you would:
    // 1. Geocode the delivery address to get coordinates
    // 2. Calculate actual distance between store and customer
    // 3. Find the appropriate delivery zone
    
    // For this MVP, we'll use a simplified approach:
    // If user has filled all address fields, we assume delivery is possible
    // and select the first zone as default
    
    if (formData.address && formData.city && formData.zip_code && deliveryZones.length > 0) {
      // In production: calculate real distance and match to zone
      // For now, we'll check if zip code matches store's region (simplified)
      
      // Simple validation: if no zones configured, block delivery
      if (deliveryZones.length === 0) {
        setDeliveryBlocked(true);
        setSelectedZone(null);
        return;
      }
      
      // For MVP: select middle zone or first zone
      const defaultZone = deliveryZones[Math.floor(deliveryZones.length / 2)] || deliveryZones[0];
      setSelectedZone(defaultZone);
      setDeliveryBlocked(false);
    } else {
      setSelectedZone(null);
    }
  };

  useEffect(() => {
    calculateDeliveryZone();
  }, [formData.address, formData.city, formData.zip_code, deliveryZones]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !store || !selectedZone) return;

    if (deliveryBlocked) {
      toast.error('Não fazemos entregas para este endereço');
      return;
    }

    setSubmitting(true);

    try {
      const subtotal = cartItems.reduce((sum, item) => {
        const product = (item.product || (item as any).products) as Product;
        return sum + (product?.price || 0) * item.quantity;
      }, 0);

      const total = subtotal + selectedZone.delivery_fee;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: store.id,
          customer_id: user.id,
          status: 'pending',
          total,
          delivery_address: formData.address,
          delivery_city: formData.city,
          delivery_state: formData.state,
          delivery_zip_code: formData.zip_code,
          delivery_zone_id: selectedZone.id,
          delivery_fee: selectedZone.delivery_fee,
          customer_notes: formData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => {
        const product = (item.product || (item as any).products) as Product;
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price,
          notes: item.notes,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .maybeSingle();

      if (cart) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id);
      }

      toast.success('Pedido realizado com sucesso!');
      navigate('/perfil/pedidos');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao finalizar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const product = (item.product || (item as any).products) as Product;
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const total = subtotal + (selectedZone?.delivery_fee || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" asChild>
              <Link to={`/${storeSlug}/carrinho`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao carrinho
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Finalizar Pedido</h1>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Rua, número, bairro"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      maxLength={2}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP *</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    placeholder="00000-000"
                    required
                  />
                </div>

                {deliveryZones.length === 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esta loja ainda não configurou zonas de entrega. Entre em contato com o estabelecimento.
                    </AlertDescription>
                  </Alert>
                )}

                {deliveryBlocked && deliveryZones.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Desculpe, não fazemos entregas para este endereço.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedZone && !deliveryBlocked && (
                  <Alert>
                    <AlertDescription>
                      Taxa de entrega: {formatCurrency(selectedZone.delivery_fee)}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        Zona de {selectedZone.radius_km}km
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Alguma observação sobre seu pedido? (ex: sem cebola, ponto da carne)"
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => {
                    const product = (item.product || (item as any).products) as Product;
                    if (!product) return null;
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {product.name}</span>
                        <span>{formatCurrency(product.price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrega</span>
                    <span>
                      {selectedZone ? formatCurrency(selectedZone.delivery_fee) : '-'}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || deliveryBlocked || !selectedZone || deliveryZones.length === 0}
                >
                  {submitting ? 'Finalizando...' : 'Finalizar Pedido'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Pagamento na entrega
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}


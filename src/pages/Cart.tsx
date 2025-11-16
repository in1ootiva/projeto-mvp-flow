import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Store, Product, CartItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function Cart() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error('Faça login para ver seu carrinho');
      navigate('/login');
      return;
    }
    loadCart();
  }, [user, storeSlug]);

  const loadCart = async () => {
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

        if (itemsError) {
          console.error('Error loading cart items:', itemsError);
          throw itemsError;
        }

        setCartItems(items || []);
      } else {
        setCartItems([]);
      }
    } catch (error: any) {
      console.error('Error loading cart:', error);
      toast.error('Erro ao carregar carrinho');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      await loadCart();
    } catch (error: any) {
      toast.error('Erro ao atualizar quantidade');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item removido do carrinho');
      await loadCart();
    } catch (error: any) {
      toast.error('Erro ao remover item');
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
              <Link to={`/${storeSlug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao cardápio
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Seu Carrinho</h1>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
              <Button asChild>
                <Link to={`/${storeSlug}`}>Ver Cardápio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                // Handle both 'product' and 'products' from join
                const product = (item.product || (item as any).products) as Product;
                if (!product) return null;

                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold">{product.name}</h3>
                              {product.description && (
                                <p className="text-sm text-muted-foreground">
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <span className="font-bold">
                              {formatCurrency(product.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxa de entrega</span>
                      <span>A calcular</span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to={`/${storeSlug}/checkout`}>
                      Finalizar Pedido
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


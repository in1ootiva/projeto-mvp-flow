import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Store, Product, CartItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';

export function PublicMenu() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoreAndProducts();
    if (user) {
      loadCart();
    }
  }, [storeSlug, user]);

  const loadStoreAndProducts = async () => {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!storeData) {
        toast.error('Loja não encontrada');
        return;
      }
      
      setStore(storeData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('active', true)
        .order('category', { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error: any) {
      toast.error('Erro ao carregar cardápio');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    if (!user || !store) return;

    try {
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .maybeSingle();

      if (cartError) {
        console.error('Error loading cart:', cartError);
        return;
      }

      if (cart) {
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select('*, products(*)')
          .eq('cart_id', cart.id);

        if (itemsError) {
          console.error('Error loading cart items:', itemsError);
          return;
        }

        setCartItems(items || []);
      }
    } catch (error: any) {
      console.error('Error loading cart:', error);
    }
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      toast.error('Faça login para adicionar itens ao carrinho');
      navigate('/login');
      return;
    }

    if (!store) return;

    try {
      // Get or create cart
      let { data: cart, error: cartQueryError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .maybeSingle();

      if (cartQueryError) throw cartQueryError;

      if (!cart) {
        const { data: newCart, error: cartError } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            store_id: store.id,
          })
          .select()
          .single();

        if (cartError) throw cartError;
        cart = newCart;
      }

      // Check if item already exists in cart
      const { data: existingItem, error: existingItemError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItemError) throw existingItemError;

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: product.id,
            quantity: 1,
          });

        if (error) throw error;
      }

      toast.success('Produto adicionado ao carrinho!');
      await loadCart();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar ao carrinho');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Sem categoria';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const product = (item.product || (item as any).products) as Product;
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loja não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {store.logo_url && (
                <img src={store.logo_url} alt={store.name} className="h-10" />
              )}
              <h1 className="text-xl font-bold">{store.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Button variant="ghost" asChild>
                  <Link to="/perfil">
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
              )}
              {store.whatsapp && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contato
                </Button>
              )}
              <Button asChild>
                <Link to={`/${storeSlug}/carrinho`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Carrinho ({cartItemsCount})
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(product.price)}
                        </span>
                        <Button onClick={() => addToCart(product)}>
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum produto disponível no momento
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Floating cart button (mobile) */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <Button size="lg" className="rounded-full shadow-lg" asChild>
            <Link to={`/${storeSlug}/carrinho`}>
              <ShoppingCart className="h-5 w-5 mr-2" />
              {cartItemsCount} itens • {formatCurrency(cartTotal)}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}


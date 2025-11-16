import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Order, OrderItem, Product, Store } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, MessageCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface OrderWithDetails extends Order {
  store?: Store;
  order_items?: (OrderItem & { product?: Product })[];
}

export function CustomerOrders() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores(*),
          order_items(*, products(*))
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar pedidos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleWhatsApp = (store: Store) => {
    if (!store.whatsapp || !selectedOrder) return;
    const message = `Olá! Gostaria de falar sobre o pedido #${selectedOrder.id.slice(0, 8)}`;
    const whatsappUrl = `https://wa.me/${store.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      delivered: 'Entregue',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

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
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link to="/perfil">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao perfil
              </Link>
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Você ainda não fez nenhum pedido</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewOrder(order)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{order.store?.name}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      {order.order_items?.length || 0} itens
                    </span>
                    <span className="font-bold">{formatCurrency(order.total)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Pedido #{selectedOrder.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.store?.name}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusLabel(selectedOrder.status)}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product?.name}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.delivery_address}
                    {selectedOrder.delivery_city && `, ${selectedOrder.delivery_city}`}
                    {selectedOrder.delivery_state && ` - ${selectedOrder.delivery_state}`}
                  </p>
                </div>

                {selectedOrder.customer_notes && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Observações</h3>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customer_notes}</p>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm">{formatCurrency(selectedOrder.total - selectedOrder.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa de entrega</span>
                    <span className="text-sm">{formatCurrency(selectedOrder.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {selectedOrder.store?.whatsapp && (
                  <Button
                    className="w-full"
                    onClick={() => handleWhatsApp(selectedOrder.store!)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Falar com o Restaurante
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}


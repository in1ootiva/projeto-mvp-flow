import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Profile, Order } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerWithOrders extends Profile {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
}

export function AdminCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithOrders[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithOrders | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [user]);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    if (!user) return;

    try {
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('admin_id', user.id)
        .maybeSingle();

      if (!store) return;

      // Get all orders for this store
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id);

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        toast.error('Erro ao carregar pedidos');
        return;
      }

      if (!orders || orders.length === 0) {
        setCustomers([]);
        setFilteredCustomers([]);
        return;
      }

      // Get unique customer IDs
      const customerIds = [...new Set(orders.map(order => order.customer_id))];

      // Get all customer profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', customerIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        toast.error('Erro ao carregar clientes');
        return;
      }

      if (!profiles) return;

      // Create a map of profiles for quick lookup
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // Group orders by customer
      const customerMap = new Map<string, CustomerWithOrders>();

      orders.forEach(order => {
        const profile = profileMap.get(order.customer_id);
        if (!profile) return;

        if (!customerMap.has(profile.id)) {
          customerMap.set(profile.id, {
            ...profile,
            totalOrders: 0,
            totalSpent: 0,
          });
        }

        const customer = customerMap.get(profile.id)!;
        customer.totalOrders++;
        customer.totalSpent += order.total;
        if (!customer.lastOrderDate || order.created_at > customer.lastOrderDate) {
          customer.lastOrderDate = order.created_at;
        }
      });

      const customersArray = Array.from(customerMap.values());
      setCustomers(customersArray);
      setFilteredCustomers(customersArray);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    );

    setFilteredCustomers(filtered);
  };

  const loadCustomerOrders = async (customerId: string) => {
    try {
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('admin_id', user!.id)
        .single();

      if (!store) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomerOrders(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar pedidos do cliente');
      console.error(error);
    }
  };

  const handleViewCustomer = async (customer: CustomerWithOrders) => {
    setSelectedCustomer(customer);
    await loadCustomerOrders(customer.id);
    setDialogOpen(true);
  };

  const handleWhatsApp = (phone: string, customerName: string) => {
    const message = `Olá ${customerName}! Aqui é da loja. Como posso ajudar?`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">
            Gerencie seus clientes e visualize o histórico de pedidos
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">{customer.email}</p>
                    <p className="text-muted-foreground">{customer.phone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Pedidos</p>
                      <p className="text-lg font-bold">{customer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Gasto</p>
                      <p className="text-lg font-bold">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                  </div>
                  {customer.lastOrderDate && (
                    <p className="text-xs text-muted-foreground">
                      Último pedido: {formatDate(customer.lastOrderDate)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewCustomer(customer)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Pedidos
                    </Button>
                    {customer.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWhatsApp(customer.phone!, customer.name)}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pedidos de {selectedCustomer?.name}</DialogTitle>
            </DialogHeader>
            {customerOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pedido encontrado
              </p>
            ) : (
              <div className="space-y-4">
                {customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <Badge>{getStatusLabel(order.status)}</Badge>
                    </div>
                    <div className="text-sm">
                      <p><strong>Endereço:</strong> {order.delivery_address}</p>
                      {order.customer_notes && (
                        <p><strong>Observações:</strong> {order.customer_notes}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        Taxa de entrega: {formatCurrency(order.delivery_fee)}
                      </span>
                      <span className="font-bold">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}


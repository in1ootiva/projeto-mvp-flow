import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, DeliveryZone } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDelivery() {
  const { user } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState({
    radius_km: '',
    delivery_fee: '',
  });

  useEffect(() => {
    loadZones();
  }, [user]);

  const loadZones = async () => {
    if (!user) return;

    try {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('admin_id', user.id)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!store) return;

      setStoreId(store.id);

      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('store_id', store.id)
        .order('radius_km', { ascending: true });

      if (error) throw error;

      setZones(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar zonas de entrega');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    try {
      const zoneData = {
        radius_km: parseFloat(formData.radius_km),
        delivery_fee: parseFloat(formData.delivery_fee),
        store_id: storeId,
      };

      if (editingZone) {
        const { error } = await supabase
          .from('delivery_zones')
          .update(zoneData)
          .eq('id', editingZone.id);

        if (error) throw error;
        toast.success('Zona de entrega atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('delivery_zones')
          .insert(zoneData);

        if (error) throw error;
        toast.success('Zona de entrega criada com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      await loadZones();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar zona de entrega');
    }
  };

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      radius_km: zone.radius_km.toString(),
      delivery_fee: zone.delivery_fee.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta zona de entrega?')) return;

    try {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      toast.success('Zona de entrega excluída com sucesso!');
      await loadZones();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir zona de entrega');
    }
  };

  const resetForm = () => {
    setFormData({
      radius_km: '',
      delivery_fee: '',
    });
    setEditingZone(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Zonas de Entrega</h2>
            <p className="text-muted-foreground">
              Configure os raios e taxas de entrega para sua loja
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Zona
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingZone ? 'Editar Zona de Entrega' : 'Nova Zona de Entrega'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="radius_km">Raio (km) *</Label>
                  <Input
                    id="radius_km"
                    name="radius_km"
                    type="number"
                    step="0.1"
                    value={formData.radius_km}
                    onChange={handleChange}
                    placeholder="Ex: 5"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Distância máxima em quilômetros da sua loja
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">Taxa de Entrega (R$) *</Label>
                  <Input
                    id="delivery_fee"
                    name="delivery_fee"
                    type="number"
                    step="0.01"
                    value={formData.delivery_fee}
                    onChange={handleChange}
                    placeholder="Ex: 5.00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor cobrado para entregas neste raio
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingZone ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Zonas Configuradas</CardTitle>
            <CardDescription>
              Configure diferentes taxas de entrega baseadas na distância. 
              Pedidos fora de todas as zonas configuradas serão bloqueados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {zones.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma zona de entrega configurada
              </p>
            ) : (
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        Até {zone.radius_km} km
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Taxa: {formatCurrency(zone.delivery_fee)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(zone)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(zone.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • As zonas de entrega são baseadas na distância em linha reta da sua loja até o endereço do cliente.
            </p>
            <p>
              • Configure múltiplas zonas para oferecer diferentes taxas de entrega.
            </p>
            <p>
              • Se o endereço do cliente estiver fora de todas as zonas configuradas, o pedido será bloqueado.
            </p>
            <p>
              • Recomendamos começar com zonas de 3km, 5km e 10km para cobrir diferentes áreas.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


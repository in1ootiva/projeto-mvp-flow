import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Store as StoreType } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function AdminStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStore();
  }, [user]);

  const loadStore = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('admin_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStore(data);
        setFormData({
          name: data.name,
          slug: data.slug,
          logo_url: data.logo_url || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados da loja');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          slug: formData.slug,
          logo_url: formData.logo_url || null,
          whatsapp: formData.whatsapp,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        })
        .eq('id', store.id);

      if (error) throw error;

      toast.success('Dados da loja atualizados com sucesso!');
      await loadStore();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar dados da loja');
    } finally {
      setSaving(false);
    }
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

  if (!store) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nenhuma loja encontrada. Por favor, configure sua loja primeiro.
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Minha Loja</h2>
          <p className="text-muted-foreground">
            Gerencie as informações da sua loja
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Loja</CardTitle>
            <CardDescription>
              Atualize os dados que serão exibidos para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Loja *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL da Loja *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Link do cardápio: /{formData.slug}
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logo_url">URL da Logo</Label>
                  <Input
                    id="logo_url"
                    name="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  {formData.logo_url && (
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="mt-2 h-20 w-20 object-contain border rounded"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
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
                    placeholder="SP"
                    maxLength={2}
                    required
                  />
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
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


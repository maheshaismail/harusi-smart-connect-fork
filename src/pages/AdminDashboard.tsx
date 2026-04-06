import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Users, Store, Shield, Search, Ban } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

interface VendorRow {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  city: string;
  phone: string;
  approval_status: string;
  approval_note: string;
  created_at: string;
  verified: boolean;
}

interface UserRow {
  user_id: string;
  full_name: string;
  created_at: string;
  roles: string[];
}

const AdminDashboard = () => {
  const { roles, rolesLoaded, isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorSearch, setVendorSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const isAdmin = roles.includes('admin');

  useEffect(() => {
    if (rolesLoaded && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [rolesLoaded, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    const [vendorRes, profileRes, rolesRes] = await Promise.all([
      supabase.from('vendor_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, full_name, created_at'),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    setVendors((vendorRes.data as any[]) || []);

    // Build user list from profiles + roles
    const roleMap = new Map<string, string[]>();
    for (const r of (rolesRes.data as any[]) || []) {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    }

    const userList: UserRow[] = ((profileRes.data as any[]) || []).map(p => ({
      user_id: p.user_id,
      full_name: p.full_name || '',
      created_at: p.created_at,
      roles: roleMap.get(p.user_id) || [],
    }));
    setUsers(userList);
    setLoading(false);
  };

  const handleApproval = async (vendorId: string, status: 'approved' | 'rejected') => {
    const note = noteMap[vendorId] || '';
    const { error } = await supabase
      .from('vendor_profiles')
      .update({ approval_status: status, approval_note: note } as any)
      .eq('id', vendorId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: status === 'approved' ? '✅ Vendor Approved' : '❌ Vendor Rejected' });
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, approval_status: status, approval_note: note } : v));
    }
  };

  const handleToggleRole = async (userId: string, role: string, hasRole: boolean) => {
    if (hasRole) {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role as any);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role } as any);
    }
    await loadData();
    toast({ title: hasRole ? `Role "${role}" removed` : `Role "${role}" added` });
  };

  const filteredVendors = vendors.filter(v => {
    const matchSearch = v.business_name.toLowerCase().includes(vendorSearch.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.approval_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.user_id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingCount = vendors.filter(v => v.approval_status === 'pending').length;

  if (!rolesLoaded || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <div className="container max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-display font-bold">
              {language === 'sw' ? 'Dashibodi ya Msimamizi' : 'Admin Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'sw' ? 'Simamia watoa huduma na watumiaji' : 'Manage vendors and users'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Store className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{vendors.length}</p>
            <p className="text-xs text-muted-foreground">{language === 'sw' ? 'Watoa Huduma' : 'Vendors'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">{language === 'sw' ? 'Wanasubiri' : 'Pending'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">{language === 'sw' ? 'Watumiaji' : 'Users'}</p>
          </div>
        </div>

        <Tabs defaultValue="vendors">
          <TabsList className="w-full">
            <TabsTrigger value="vendors" className="flex-1 relative">
              <Store className="h-4 w-4 mr-1" />
              {language === 'sw' ? 'Watoa Huduma' : 'Vendors'}
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              <Users className="h-4 w-4 mr-1" />
              {language === 'sw' ? 'Watumiaji' : 'Users'}
            </TabsTrigger>
          </TabsList>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'sw' ? 'Tafuta mtoa huduma...' : 'Search vendors...'}
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="all">{language === 'sw' ? 'Zote' : 'All'}</option>
                <option value="pending">{language === 'sw' ? 'Inasubiri' : 'Pending'}</option>
                <option value="approved">{language === 'sw' ? 'Imeidhinishwa' : 'Approved'}</option>
                <option value="rejected">{language === 'sw' ? 'Imekataliwa' : 'Rejected'}</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {language === 'sw' ? 'Hakuna watoa huduma' : 'No vendors found'}
              </p>
            ) : (
              filteredVendors.map(vendor => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{vendor.business_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {vendor.category} • {vendor.city} • {vendor.phone}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {language === 'sw' ? 'Iliundwa' : 'Created'}: {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      vendor.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                      vendor.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {vendor.approval_status === 'approved' 
                        ? (language === 'sw' ? 'Imeidhinishwa' : 'Approved')
                        : vendor.approval_status === 'rejected'
                        ? (language === 'sw' ? 'Imekataliwa' : 'Rejected')
                        : (language === 'sw' ? 'Inasubiri' : 'Pending')}
                    </span>
                  </div>

                  {vendor.approval_note && (
                    <p className="text-xs bg-muted rounded-lg p-2 mb-2">
                      <strong>{language === 'sw' ? 'Maelezo' : 'Note'}:</strong> {vendor.approval_note}
                    </p>
                  )}

                  {vendor.approval_status === 'pending' && (
                    <div className="space-y-2 mt-3">
                      <Textarea
                        placeholder={language === 'sw' ? 'Maelezo ya ziada (hiari)...' : 'Optional note...'}
                        value={noteMap[vendor.id] || ''}
                        onChange={e => setNoteMap(prev => ({ ...prev, [vendor.id]: e.target.value }))}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproval(vendor.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {language === 'sw' ? 'Idhinisha' : 'Approve'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleApproval(vendor.id, 'rejected')}>
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          {language === 'sw' ? 'Kataa' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {vendor.approval_status !== 'pending' && (
                    <div className="flex gap-2 mt-2">
                      {vendor.approval_status === 'rejected' && (
                        <Button size="sm" variant="outline" onClick={() => handleApproval(vendor.id, 'approved')}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {language === 'sw' ? 'Idhinisha' : 'Approve'}
                        </Button>
                      )}
                      {vendor.approval_status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => handleApproval(vendor.id, 'rejected')}>
                          <Ban className="h-3.5 w-3.5 mr-1" />
                          {language === 'sw' ? 'Ondoa Idhini' : 'Revoke'}
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'sw' ? 'Tafuta mtumiaji...' : 'Search users...'}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {language === 'sw' ? 'Hakuna watumiaji' : 'No users found'}
              </p>
            ) : (
              filteredUsers.map(u => (
                <div key={u.user_id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{u.full_name || 'Unnamed User'}</h3>
                      <p className="text-xs text-muted-foreground">
                        ID: {u.user_id.slice(0, 8)}... • {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {u.roles.map(r => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {(['vendor', 'admin', 'customer'] as const).map(role => {
                      const has = u.roles.includes(role);
                      return (
                        <Button
                          key={role}
                          size="sm"
                          variant={has ? 'default' : 'outline'}
                          onClick={() => handleToggleRole(u.user_id, role, has)}
                          className="text-xs"
                          disabled={role === 'admin' && u.user_id === user?.id}
                        >
                          {has ? '✓ ' : '+ '}{role}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

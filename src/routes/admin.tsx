import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SiteHeader } from "@/components/SiteHeader";
import { PHP } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, LogOut } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Car = Tables<"cars">;
type Inquiry = Tables<"inquiries">;

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [inquiries, setInquiries] = useState<(Inquiry & { cars: { name: string } | null })[]>([]);
  const [editing, setEditing] = useState<Car | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from("cars").select("*").order("created_at", { ascending: false }),
      supabase.from("inquiries").select("*, cars(name)").order("created_at", { ascending: false }),
    ]);
    setCars(c ?? []);
    setInquiries((i as any) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) { navigate({ to: "/auth" }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);
      setAuthChecked(true);
      if (admin) refresh();
    })();
  }, [navigate, refresh]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-4xl">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">Your account does not have admin privileges.</p>
          <Button className="mt-6" onClick={logout}>Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Admin</div>
            <h1 className="font-display text-4xl">Dashboard</h1>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
        </div>

        <Tabs defaultValue="cars">
          <TabsList>
            <TabsTrigger value="cars">Cars ({cars.length})</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="cars" className="mt-6">
            <div className="flex justify-end mb-4">
              <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Car
                  </Button>
                </DialogTrigger>
                <CarFormDialog car={editing} onSaved={() => { setDialogOpen(false); setEditing(null); refresh(); }} />
              </Dialog>
            </div>
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cars.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{PHP(Number(c.price))}</TableCell>
                      <TableCell>
                        {c.status === "available"
                          ? <Badge>Available</Badge>
                          : <Badge variant="destructive">Out of Stock</Badge>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          const next = c.status === "available" ? "out_of_stock" : "available";
                          const { error } = await supabase.from("cars").update({ status: next }).eq("id", c.id);
                          if (error) toast.error(error.message); else { toast.success("Status updated"); refresh(); }
                        }}>
                          {c.status === "available" ? "Suspend" : "Restore"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="inquiries" className="mt-6">
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>DP</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Years</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-xs">{new Date(q.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant={q.inquiry_type === "reserve" ? "default" : "secondary"}>{q.inquiry_type}</Badge></TableCell>
                      <TableCell className="font-medium">{q.full_name}</TableCell>
                      <TableCell className="text-xs">{q.contact_number}<br /><span className="text-muted-foreground">{q.email}</span></TableCell>
                      <TableCell>{q.cars?.name ?? "—"}</TableCell>
                      <TableCell>{PHP(Number(q.downpayment))}</TableCell>
                      <TableCell>{PHP(Number(q.monthly_payment))}</TableCell>
                      <TableCell>{q.years_to_pay}</TableCell>
                    </TableRow>
                  ))}
                  {inquiries.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No inquiries yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CarFormDialog({ car, onSaved }: { car: Car | null; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name")).trim();
    const price = Number(fd.get("price"));
    const description = String(fd.get("description") || "");
    if (!name || !price) { toast.error("Name and price required"); return; }
    setSaving(true);

    let image_url = car?.image_url ?? null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("car-images").upload(path, imageFile);
      if (upErr) { toast.error(upErr.message); setSaving(false); return; }
      image_url = supabase.storage.from("car-images").getPublicUrl(path).data.publicUrl;
    }

    const payload = { name, price, description, image_url };
    const { error } = car
      ? await supabase.from("cars").update(payload).eq("id", car.id)
      : await supabase.from("cars").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(car ? "Car updated" : "Car added");
    onSaved();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle className="font-display text-2xl">{car ? "Edit Car" : "Add New Car"}</DialogTitle></DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={car?.name ?? ""} maxLength={150} />
        </div>
        <div>
          <Label htmlFor="price">Price (PHP)</Label>
          <Input id="price" name="price" type="number" required min={1} step={1000} defaultValue={car?.price ?? ""} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={car?.description ?? ""} maxLength={500} />
        </div>
        <div>
          <Label htmlFor="image">Image {car?.image_url && "(replace)"}</Label>
          <Input id="image" name="image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          {car?.image_url && !imageFile && <img src={car.image_url} alt="" className="mt-2 h-24 rounded object-cover" />}
        </div>
        <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : car ? "Update Car" : "Add Car"}</Button>
      </form>
    </DialogContent>
  );
}

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
import { Plus, Pencil, LogOut, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Car = Tables<"cars">;
type Inquiry = Tables<"inquiries">;
type MtoDesign = Tables<"made_to_order_designs">;
type MtoInquiry = Tables<"made_to_order_inquiries">;

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [inquiries, setInquiries] = useState<(Inquiry & { cars: { name: string } | null })[]>([]);
  const [editing, setEditing] = useState<Car | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [carSearch, setCarSearch] = useState("");
  const [mtoDesigns, setMtoDesigns] = useState<MtoDesign[]>([]);
  const [mtoInquiries, setMtoInquiries] = useState<MtoInquiry[]>([]);
  const [mtoDialogOpen, setMtoDialogOpen] = useState(false);
  const [mtoEditing, setMtoEditing] = useState<MtoDesign | null>(null);

  const refresh = useCallback(async () => {
    const [{ data: c }, { data: i }, { data: md }, { data: mi }] = await Promise.all([
      supabase.from("cars").select("*").order("price", { ascending: true }),
      supabase.from("inquiries").select("*, cars(name)").order("created_at", { ascending: false }),
      supabase.from("made_to_order_designs").select("*").order("category").order("name"),
      supabase.from("made_to_order_inquiries").select("*").order("created_at", { ascending: false }),
    ]);
    setCars(c ?? []);
    setInquiries((i as any) ?? []);
    setMtoDesigns(md ?? []);
    setMtoInquiries(mi ?? []);
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
            <TabsTrigger value="cars">Cars ({cars.filter((c) => c.name.toLowerCase().includes(carSearch.trim().toLowerCase())).length} / {cars.length})</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
            <TabsTrigger value="mto-designs">MTO Designs ({mtoDesigns.length})</TabsTrigger>
            <TabsTrigger value="mto-inquiries">MTO Inquiries ({mtoInquiries.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="cars" className="mt-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cars..."
                  value={carSearch}
                  onChange={(e) => setCarSearch(e.target.value)}
                  className="pl-9 w-[220px]"
                />
              </div>
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
                  {cars
                    .filter((c) => c.name.toLowerCase().includes(carSearch.trim().toLowerCase()))
                    .map((c) => (
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
                  {cars.filter((c) => c.name.toLowerCase().includes(carSearch.trim().toLowerCase())).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No cars match your search.
                      </TableCell>
                    </TableRow>
                  )}
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

          <TabsContent value="mto-designs" className="mt-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm text-muted-foreground">Manage made-to-order minivan and minitruck designs.</p>
              <Dialog open={mtoDialogOpen} onOpenChange={(v) => { setMtoDialogOpen(v); if (!v) setMtoEditing(null); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setMtoEditing(null); setMtoDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Minivan / Minitruck
                  </Button>
                </DialogTrigger>
                <MtoDesignFormDialog design={mtoEditing} onSaved={() => { setMtoDialogOpen(false); setMtoEditing(null); refresh(); }} />
              </Dialog>
            </div>
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mtoDesigns.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell><img src={d.image_url} alt={d.name} className="h-12 w-16 object-contain bg-muted rounded" /></TableCell>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{d.category}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => { setMtoEditing(d); setMtoDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          if (!confirm(`Delete design "${d.name}"?`)) return;
                          const { error } = await supabase.from("made_to_order_designs").delete().eq("id", d.id);
                          if (error) toast.error(error.message); else { toast.success("Design deleted"); refresh(); }
                        }}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {mtoDesigns.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No designs yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="mto-inquiries" className="mt-6">
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Design</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mtoInquiries.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-xs">{new Date(q.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{q.category}</Badge></TableCell>
                      <TableCell>{q.design_name ?? "—"}</TableCell>
                      <TableCell className="font-medium">{q.full_name}</TableCell>
                      <TableCell className="text-xs">{q.contact_number}<br /><span className="text-muted-foreground">{q.email}</span></TableCell>
                      <TableCell className="text-xs max-w-[260px] whitespace-pre-wrap">{q.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {mtoInquiries.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No made-to-order inquiries yet.</TableCell></TableRow>
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    (car?.images && car.images.length > 0)
      ? car.images
      : car?.image_url ? [car.image_url] : []
  );

  const totalCount = existingImages.length + imageFiles.length;

  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const allowed = Math.max(0, 5 - existingImages.length - imageFiles.length);
    if (picked.length > allowed) toast.error(`You can only add ${allowed} more image(s). Max 5 per car.`);
    setImageFiles((prev) => [...prev, ...picked.slice(0, allowed)]);
    e.target.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name")).trim();
    const price = Number(fd.get("price"));
    const description = String(fd.get("description") || "");
    if (!name || !price) { toast.error("Name and price required"); return; }
    if (existingImages.length + imageFiles.length > 5) { toast.error("Max 5 images per car"); return; }
    setSaving(true);

    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("car-images").upload(path, file);
      if (upErr) { toast.error(upErr.message); setSaving(false); return; }
      uploadedUrls.push(supabase.storage.from("car-images").getPublicUrl(path).data.publicUrl);
    }

    const images = [...existingImages, ...uploadedUrls];
    const image_url = images[0] ?? null;

    const payload = { name, price, description, image_url, images };
    const { error } = car
      ? await supabase.from("cars").update(payload).eq("id", car.id)
      : await supabase.from("cars").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(car ? "Car updated" : "Car added");
    onSaved();
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
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
          <Label htmlFor="image">Images ({totalCount}/5)</Label>
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            multiple
            disabled={totalCount >= 5}
            onChange={onFilesPicked}
          />
          <p className="text-xs text-muted-foreground mt-1">Upload up to 5 photos. The first one is used as the cover.</p>
          {(existingImages.length > 0 || imageFiles.length > 0) && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {existingImages.map((url, i) => (
                <div key={`e-${i}`} className="relative">
                  <img src={url} alt="" className="h-20 w-full rounded object-cover" />
                  <button
                    type="button"
                    onClick={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 text-xs leading-none"
                  >×</button>
                </div>
              ))}
              {imageFiles.map((file, i) => (
                <div key={`n-${i}`} className="relative">
                  <img src={URL.createObjectURL(file)} alt="" className="h-20 w-full rounded object-cover ring-2 ring-primary" />
                  <button
                    type="button"
                    onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 text-xs leading-none"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : car ? "Update Car" : "Add Car"}</Button>
      </form>
    </DialogContent>
  );
}

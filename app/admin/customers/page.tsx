"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { validateBrazilianPhone, formatPhone } from "@/lib/validatePhone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  cpf: string | null;
  email: string | null;
  orderCount: number;
  createdAt: string;
}

interface CustomerForm {
  name: string;
  phone: string;
  cpf: string;
  email: string;
}

const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  cpf: "",
  email: "",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CustomerForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPhoneError, setCreatePhoneError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CustomerForm>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const applyPhoneMask = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      setCustomers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const phoneValidation = validateBrazilianPhone(createForm.phone);
    if (!phoneValidation.valid) {
      setCreatePhoneError(phoneValidation.error ?? "Telefone inválido.");
      return;
    }
    setCreatePhoneError(null);

    setCreating(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          phone: createForm.phone,
          cpf: createForm.cpf || undefined,
          email: createForm.email || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao cadastrar cliente");
      }

      setCreateForm(EMPTY_FORM);
      setCreatePhoneError(null);
      setCreateOpen(false);
      await fetchCustomers();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Erro ao cadastrar cliente");
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name,
      phone: formatPhone(customer.phone),
      cpf: customer.cpf ?? "",
      email: customer.email ?? "",
    });
    setEditError(null);
    setEditPhoneError(null);
    setEditOpen(true);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);

    const phoneValidation = validateBrazilianPhone(editForm.phone);
    if (!phoneValidation.valid) {
      setEditPhoneError(phoneValidation.error ?? "Telefone inválido.");
      return;
    }
    setEditPhoneError(null);

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/customers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          cpf: editForm.cpf || null,
          email: editForm.email || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao editar cliente");
      }

      setEditOpen(false);
      setEditingId(null);
      await fetchCustomers();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Erro ao editar cliente");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este cliente?")) return;

    setDeleteId(id);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao excluir cliente");
      }
      await fetchCustomers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir cliente");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{customers.length} cliente(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCustomers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setCreateError(null); setCreatePhoneError(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 98765-4321"
                    value={createForm.phone}
                    onChange={(e) => {
                      const masked = applyPhoneMask(e.target.value);
                      setCreateForm({ ...createForm, phone: masked });
                      setCreatePhoneError(null);
                    }}
                    required
                  />
                  {createPhoneError && (
                    <p className="text-sm text-red-500">{createPhoneError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF (opcional)</Label>
                  <Input
                    id="cpf"
                    value={createForm.cpf}
                    onChange={(e) => setCreateForm({ ...createForm, cpf: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                {createError && (
                  <p className="text-sm text-red-500">{createError}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? "Salvando..." : "Cadastrar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setCreateError(null); setCreatePhoneError(null); }}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              Nenhum cliente cadastrado. Clique em Novo Cliente para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead className="w-[140px]">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email ?? "-"}</TableCell>
                    <TableCell>{customer.orderCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteId === customer.id}
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone *</Label>
              <Input
                id="edit-phone"
                placeholder="(11) 98765-4321"
                value={editForm.phone}
                onChange={(e) => {
                  const masked = applyPhoneMask(e.target.value);
                  setEditForm({ ...editForm, phone: masked });
                  setEditPhoneError(null);
                }}
                required
              />
              {editPhoneError && (
                <p className="text-sm text-red-500">{editPhoneError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cpf">CPF (opcional)</Label>
              <Input
                id="edit-cpf"
                value={editForm.cpf}
                onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (opcional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            {editError && (
              <p className="text-sm text-red-500">{editError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={savingEdit} className="flex-1">
                {savingEdit ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setEditOpen(false); setEditError(null); setEditPhoneError(null); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-gray-400">
        Dica: voce tambem pode consultar dados diretamente pela API em
        <Link href="/api/customers" className="ml-1 text-orange-600 underline">
          /api/customers
        </Link>
      </p>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import AddUserModal from "@/components/Clients/AddUserModal";
import ProfileModal from "@/components/Clients/ProfileModal";
import PageTitle from "@/components/Seo/PageTitle";
import EmptyTable from "@/components/Table/EmptyTable";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getClients } from "@/external-api/functions/coach.api";
import AppLayout from "@/layouts/AppLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ellipsis, Plus, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import moment from "moment";
import { useMemo, useState } from "react";
import { getUserById } from "@/external-api/functions/user.api";

function Clients() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isCoach = session?.user?.role === "coach";

  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients
  });

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (client) =>
        client.fullName?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term)
    );
  }, [data, search]);

  const prefetchOnMouseEnter = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["clientDetails", id],
      queryFn: () => getUserById(id),
      staleTime: 5 * 60 * 1000
    });
  };

  return (
    <AppLayout>
      <PageTitle title="Clients" />
      <div className="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start max-sm:mb-2">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900">
          All Clients
        </h1>
        <div className="flex items-center gap-3 max-sm:w-full max-sm:gap-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-64 max-sm:w-full"
            />
          </div>
          {isCoach && (
            <Button
              className="shrink-0 whitespace-nowrap"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={16} />
              Add User
            </Button>
          )}
        </div>
      </div>
      <Separator />
      {isCoach && (
        <AddUserModal open={isAddOpen} onOpenChange={setIsAddOpen} />
      )}
      <div className="mt-4 max-md:w-[95vw] max-md:overflow-auto scrollbar-hide max-[480px]:!w-[93vw]">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow className="border-none">
              <TableHead className="text-xs text-gray-500">Names</TableHead>
              <TableHead className="text-xs text-gray-500">Email</TableHead>
              <TableHead className="text-xs text-gray-500">Since</TableHead>
              <TableHead className="text-xs text-gray-500 rounded-r-md">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableCell colSpan={4} className="p-0 pt-1.5">
                    <div className="h-17 w-full rounded-md bg-gray-200/80 animate-pulse" />
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableCell colSpan={4} className="p-0 pt-1.5">
                    <div className="h-17 w-full rounded-md bg-gray-200/80 animate-pulse" />
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableCell colSpan={4} className="p-0 pt-1.5">
                    <div className="h-17 w-full rounded-md bg-gray-200/80 animate-pulse" />
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableCell colSpan={4} className="p-0 pt-1.5">
                    <div className="h-17 w-full rounded-md bg-gray-200/80 animate-pulse" />
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableCell colSpan={4} className="p-0 pt-1.5">
                    <div className="h-17 w-full rounded-md bg-gray-200/80 animate-pulse" />
                  </TableCell>
                </TableRow>
              </>
            ) : filteredClients?.length > 0 ? (
              filteredClients.map((client, index) => (
                <TableRow key={index} className="cursor-pointer">
                  <TableCell
                    className="py-3.5"
                    onClick={() => setClientId(client._id)}
                    onMouseEnter={() => prefetchOnMouseEnter(client._id)}
                  >
                    <div className="flex items-center gap-3">
                      <SmartAvatar
                        src={client.photo}
                        name={client.fullName}
                        className="size-10"
                      />
                      {client.fullName}
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 text-gray-500">
                    {client.email}
                  </TableCell>
                  <TableCell className="py-3.5 text-sm text-gray-600">
                    {moment(client.createdAt).format("ll")}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Dialog
                      open={clientId === client._id}
                      onOpenChange={(open) => {
                        if (open) setClientId(client._id);
                        else setClientId("");
                      }}
                    >
                      <DialogTrigger>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-secondary"
                          asChild
                        >
                          <Ellipsis className="text-gray-500 rotate-90" />
                        </Button>
                      </DialogTrigger>
                      <ProfileModal client={client} />
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyTable
                message={
                  search.trim()
                    ? "No clients match your search"
                    : "No clients found"
                }
                colSpan={4}
              />
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}

export default Clients;

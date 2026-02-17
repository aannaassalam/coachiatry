import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import ProfileModal from "@/components/Clients/ProfileModal";
import EmptyTable from "@/components/Table/EmptyTable";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
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
import { Ellipsis } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { getUserById } from "@/external-api/functions/user.api";

function Clients() {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients
  });

  const prefetchOnMouseEnter = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["clientDetails", id],
      queryFn: () => getUserById(id),
      staleTime: 5 * 60 * 1000
    });
  };

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:mb-2">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2">
          All Clients
        </h1>
        {/* <div className="flex gap-3 max-sm:w-full max-sm:gap-1 max-sm:mt-1">
          <Button variant="ghost">
            <Image src={assets.icons.sort} alt="sort" width={18} height={18} />
            Sort
          </Button>
          <Button variant="ghost" className="gap-1.5 font-semibold mr-2">
            <ListFilter />
            Filter
          </Button>
          <Button className="max-sm:ml-auto">Add a New Client</Button>
        </div> */}
      </div>
      <Separator />
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
            ) : data?.length > 0 ? (
              data.map((client, index) => (
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
              <EmptyTable message="No clients found" colSpan={4} />
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}

export default Clients;

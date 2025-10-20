import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { Ellipsis, ListFilter } from "lucide-react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import React, { useState } from "react";
import moment from "moment";
import EmptyTable from "@/components/Table/EmptyTable";
import { Dialog } from "@/components/ui/dialog";
import ProfileModal from "@/components/Clients/ProfileModal";

function Clients() {
  const [open, setOpen] = useState(false);

  const [clients] = useState([
    {
      name: "Savannah Nguyen",
      age: 24,
      gender: "Male",
      email: "ahmad@yahoo.com",
      date: new Date(),
      avatar: assets.avatar
    },
    {
      name: "Savannah Nguyen",
      age: 24,
      gender: "Male",
      email: "ahmad@yahoo.com",
      date: new Date(),
      avatar: assets.avatar2
    },
    {
      name: "Savannah Nguyen",
      age: 24,
      gender: "Male",
      email: "ahmad@yahoo.com",
      date: new Date(),
      avatar: assets.avatar
    },
    {
      name: "Savannah Nguyen",
      age: 24,
      gender: "Male",
      email: "ahmad@yahoo.com",
      date: new Date(),
      avatar: assets.avatar
    },
    {
      name: "Savannah Nguyen",
      age: 24,
      gender: "Male",
      email: "ahmad@yahoo.com",
      date: new Date(),
      avatar: assets.avatar2
    },
    {
      name: "Savannah Nguyen",
      age: 24,
      gender: "Male",
      email: "ahmad@yahoo.com",
      date: new Date(),
      avatar: assets.avatar
    },
    {
      name: "Savannah Nguyen",
      age: 24,
      gender: "Male",
      email: "ahmad@yahoo.com",
      date: new Date(),
      avatar: assets.avatar
    },
    {
      name: "Savannah Nguyen",
      age: 24,
      gender: "Male",
      email: "ahmad@yahoo.com",
      date: new Date(),
      avatar: assets.avatar2
    }
  ]);

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:mb-2">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2">
          All Clients
        </h1>
        <div className="flex gap-3 max-sm:w-full max-sm:gap-1 max-sm:mt-1">
          <Button variant="ghost">
            <Image src={assets.icons.sort} alt="sort" width={18} height={18} />
            Sort
          </Button>
          <Button variant="ghost" className="gap-1.5 font-semibold mr-2">
            <ListFilter />
            Filter
          </Button>
          <Button className="max-sm:ml-auto">Add a New Client</Button>
        </div>
      </div>
      <Separator />
      <div className="mt-4 max-md:w-[95vw] max-md:overflow-auto scrollbar-hide max-[480px]:!w-[93vw]">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow className="border-none">
              <TableHead className="text-xs text-gray-500">Names</TableHead>
              <TableHead className="text-xs text-gray-500">Age</TableHead>
              <TableHead className="text-xs text-gray-500">Gender</TableHead>
              <TableHead className="text-xs text-gray-500">Email</TableHead>
              <TableHead className="text-xs text-gray-500">Since</TableHead>
              <TableHead className="text-xs text-gray-500 rounded-r-md">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length > 0 ? (
              clients.map((client, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer"
                  onClick={() => setOpen(true)}
                >
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={client.avatar} alt="AH" />
                        <AvatarFallback>AH</AvatarFallback>
                      </Avatar>
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell className=" text-sm text-gray-500 leading-5 cursor-pointer">
                    {client.age}
                  </TableCell>
                  <TableCell className="py-3.5 text-gray-500">
                    {client.gender}
                  </TableCell>
                  <TableCell className="py-3.5 text-gray-500">
                    {client.email}
                  </TableCell>
                  <TableCell className="py-3.5 text-sm text-gray-600">
                    {moment(client.date).format("ll")}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-secondary"
                    >
                      <Ellipsis className="text-gray-500 rotate-90" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyTable message="No documents found" colSpan={5} />
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <ProfileModal />
      </Dialog>
    </AppLayout>
  );
}

export default Clients;

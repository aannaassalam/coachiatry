import DeleteDialog from "@/components/DeleteDialog";
import EmptyTable from "@/components/Table/EmptyTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultiSelect from "@/components/ui/multi-select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUsers,
  updateUser
} from "@/external-api/functions/user.api";
import { useDebounce } from "@/hooks/utils/useDebounce";
import AppLayout from "@/layouts/AppLayout";
import { createPageRange } from "@/lib/functions/_helpers.lib";
import { PaginatedResponse } from "@/typescript/interface/common.interface";
import { User } from "@/typescript/interface/user.interface";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueries } from "@tanstack/react-query";
import { Ellipsis, Pencil, Plus, Search, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { queryClient } from "./_app";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  role: yup
    .string()
    .oneOf(["manager", "coach", "user"], "Invalid role")
    .required("Role is required"),
  assignedCoach: yup.array().of(yup.string().required()).optional().default([])
});

export function getAssignableUsersForDropdown(params: {
  allUsers: User[];
  creatorId: string;
  creatorRole: "admin" | "manager" | "coach";
  targetRole: "admin" | "manager" | "coach" | "user";
}) {
  const { allUsers, creatorId, creatorRole, targetRole } = params;

  // ✅ Manager being created => assignable: admins
  if (targetRole === "manager") {
    return {
      requiresAssignment: true,
      autoAssigned: false,
      options: allUsers
        .filter((u) => u.role === "admin")
        .map((u) => ({ label: u.fullName, value: u._id }))
    };
  }

  // ✅ Coach being created => assignable: managers
  if (targetRole === "coach") {
    // Manager creates coach => auto assigned (no dropdown)
    if (creatorRole === "manager") {
      return {
        requiresAssignment: false,
        autoAssigned: true,
        autoAssignedTo: [creatorId],
        options: []
      };
    }

    // Admin creates coach => dropdown shows all managers
    if (creatorRole === "admin") {
      return {
        requiresAssignment: true,
        autoAssigned: false,
        options: allUsers
          .filter((u) => u.role === "manager")
          .map((u) => ({ label: u.fullName, value: u._id }))
      };
    }

    // Others cannot create coach, but safe fallback
    return { requiresAssignment: false, autoAssigned: false, options: [] };
  }

  // ✅ User/patient being created => assignable: coaches
  if (targetRole === "user") {
    // Coach creates user => auto assigned to self (no dropdown)
    if (creatorRole === "coach") {
      return {
        requiresAssignment: false,
        autoAssigned: true,
        autoAssignedTo: [creatorId],
        options: []
      };
    }

    // Admin creates user => all coaches are allowed
    if (creatorRole === "admin") {
      return {
        requiresAssignment: true,
        autoAssigned: false,
        options: allUsers
          .filter((u) => u.role === "coach")
          .map((u) => ({ label: u.fullName, value: u._id }))
      };
    }

    // Manager creates user => only coaches under that manager
    if (creatorRole === "manager") {
      return {
        requiresAssignment: true,
        autoAssigned: false,
        options: allUsers
          .filter(
            (u) =>
              u.role === "coach" &&
              Array.isArray(u.assignedCoach) &&
              u.assignedCoach.includes(creatorId)
          )
          .map((u) => ({ label: u.fullName, value: u._id }))
      };
    }

    return { requiresAssignment: false, autoAssigned: false, options: [] };
  }

  // ✅ Admin being created: no assignment needed (or you can enforce rules)
  if (targetRole === "admin") {
    return { requiresAssignment: false, autoAssigned: true, options: [] };
  }

  return { requiresAssignment: false, autoAssigned: false, options: [] };
}

export default function Users() {
  const { data: info } = useSession();
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const [
    {
      data = {
        data: [],
        meta: { currentPage: 1, limit: 10, totalCount: 0, totalPages: 1 }
      },
      isLoading
    },
    { data: allUsers = [] }
  ] = useQueries({
    queries: [
      {
        queryKey: ["all-users", debouncedSearch, page],
        queryFn: () => getUsers({ search: debouncedSearch, page })
      },
      {
        queryKey: ["total-users"],
        queryFn: getAllUsers
      }
    ]
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
    meta: {
      invalidateQueries: ["all-users"]
    }
  });

  const { mutate: edit, isPending: isEditing } = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      setClientId("");
      form.reset();
    },
    meta: {
      invalidateQueries: ["all-users"]
    }
  });

  const { mutate: userDelete, isPending: isDeleting } = useMutation({
    mutationFn: deleteUser,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ["all-users", debouncedSearch, page]
      });

      const previousResponse = queryClient.getQueryData<
        PaginatedResponse<User[]>
      >(["all-users", debouncedSearch, page]);

      if (!previousResponse) {
        return { previousResponse };
      }

      const updatedUsers = previousResponse.data.filter(
        (user) => user._id !== id
      );

      queryClient.setQueryData(["all-users", debouncedSearch, page], {
        ...previousResponse,
        data: updatedUsers,
        meta: {
          ...previousResponse.meta,
          totalCount: Math.max(previousResponse.meta.totalCount - 1, 0),
          totalPages: Math.max(
            Math.ceil(
              (previousResponse.meta.totalCount - 1) /
                previousResponse.meta.limit
            ),
            1
          )
        }
      });
      return { previousResponse };
    },
    meta: {
      invalidateQueries: ["all-users"]
    }
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      assignedCoach: []
    },
    disabled: isPending || isEditing
  });

  const { autoAssigned, options, requiresAssignment } =
    getAssignableUsersForDropdown({
      allUsers: allUsers,
      creatorId: info?.user?._id || "",
      creatorRole: info?.user?.role as "admin" | "manager" | "coach",
      targetRole: form.watch("role")
    });

  const goToPage = (p: number) => {
    if (p < 1 || (data?.meta.totalPages && p > data?.meta.totalPages)) return;
    setPage(p);
  };

  const pageNumbers = createPageRange(1, data?.meta?.totalPages ?? 0, page);

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    mutate(data);
  };

  const onEdit = (data: yup.InferType<typeof schema>) => {
    edit({ userId: clientId, ...data });
  };

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:mb-2">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2">
          Users and Permissions
        </h1>
        <div className="flex gap-3">
          <div className="bg-white flex items-center pl-2.5 border-1 border-gray-200 rounded-lg w-[250px] max-sm:w-full">
            <Search className="text-gray-500 size-4.5 mr-2" />
            <input
              type="text"
              className="py-2.5 pl-1 pr-2 text-gray-900 placeholder:text-gray-500 font-lato text-sm outline-none "
              placeholder="Search users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="flex items-center" onClick={() => setOpen(true)}>
            <Plus size={14} /> Add user
          </Button>
        </div>
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
              <TableHead className="text-xs text-gray-500 rounded-l-md!">
                Name
              </TableHead>
              <TableHead className="text-xs text-gray-500">Email</TableHead>
              <TableHead className="text-xs text-gray-500">Role</TableHead>
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
            ) : data?.data?.length > 0 ? (
              data?.data
                .filter((u) => u._id !== info?.user?._id)
                .map((user) => (
                  <TableRow key={user._id} className="cursor-pointer">
                    <TableCell
                      className="py-3.5 cursor-pointer"
                      onClick={() => router.push(`/clients/${user._id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <SmartAvatar
                          src={user.photo}
                          name={user.fullName}
                          className="size-10"
                        />
                        {user.fullName}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-gray-500">
                      {user.email}
                    </TableCell>
                    <TableCell className="py-3.5 text-sm text-gray-600 capitalize">
                      {user.role}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-secondary"
                          >
                            <Ellipsis className="text-gray-500" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="p-1 w-30"
                          collisionPadding={20}
                        >
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer flex items-center gap-2 w-full [&>span]:justify-start"
                            onClick={() => {
                              router.push(`/clients/${user._id}`);
                            }}
                          >
                            <File />
                            View
                          </Button> */}
                          <Dialog
                            open={clientId === user._id}
                            onOpenChange={(toggle) =>
                              setClientId(!toggle ? "" : user._id)
                            }
                          >
                            <DialogTrigger
                              title="Edit user"
                              className="w-full"
                              asChild
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer flex items-center gap-2 w-full [&>span]:justify-start"
                                onClick={() => {
                                  //   setClientId(user._id);
                                  form.reset({
                                    name: user.fullName,
                                    email: user.email,
                                    role: user.role as
                                      | "manager"
                                      | "coach"
                                      | "user",
                                    assignedCoach: user.assignedCoach || []
                                  });
                                }}
                              >
                                <Pencil />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <Form {...form}>
                              <DialogContent className="w-sm">
                                <DialogTitle>Edit user</DialogTitle>
                                <div className="space-y-3 flex flex-col">
                                  <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="text"
                                            placeholder="Enter name"
                                            //   className="h-12 font-medium text-base bg-gray-50/60"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="email"
                                            placeholder="Enter email"
                                            //   className="h-12 font-medium text-base bg-gray-50/60"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  {info?.user?.role === "admin" && (
                                    <FormField
                                      control={form.control}
                                      name="role"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Role</FormLabel>
                                          <FormControl>
                                            <RadioGroup
                                              {...field}
                                              onValueChange={field.onChange}
                                            >
                                              {info?.user?.role === "admin" && (
                                                <>
                                                  <div className="flex items-center gap-3">
                                                    <RadioGroupItem
                                                      value="admin"
                                                      id="r1"
                                                    />
                                                    <Label htmlFor="r1">
                                                      Admin
                                                    </Label>
                                                  </div>
                                                  <div className="flex items-center gap-3">
                                                    <RadioGroupItem
                                                      value="manager"
                                                      id="r2"
                                                    />
                                                    <Label htmlFor="r2">
                                                      Manager
                                                    </Label>
                                                  </div>
                                                </>
                                              )}
                                              <div className="flex items-center gap-3">
                                                <RadioGroupItem
                                                  value="coach"
                                                  id="r3"
                                                />
                                                <Label htmlFor="r3">
                                                  Coach
                                                </Label>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <RadioGroupItem
                                                  value="user"
                                                  id="r4"
                                                />
                                                <Label htmlFor="r4">
                                                  Patient
                                                </Label>
                                              </div>
                                            </RadioGroup>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                  {requiresAssignment && !autoAssigned && (
                                    <FormField
                                      control={form.control}
                                      name="assignedCoach"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Managed by</FormLabel>
                                          <FormControl>
                                            <MultiSelect
                                              options={options}
                                              placeholder="Select..."
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button
                                    center
                                    className="w-full"
                                    onClick={form.handleSubmit(onEdit)}
                                    isLoading={isEditing}
                                  >
                                    Update
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Form>
                          </Dialog>
                          <DeleteDialog
                            onDelete={() => userDelete(user._id)}
                            isLoading={isDeleting}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer flex items-center gap-2 w-full text-red-500 hover:text-red-500 hover:bg-red-50 [&>span]:justify-start"
                            >
                              <Trash />
                              Delete
                            </Button>
                          </DeleteDialog>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <EmptyTable message="No users found" colSpan={4} />
            )}
          </TableBody>
        </Table>
        {data?.meta?.totalPages && data?.meta?.totalPages > 1 ? (
          <Pagination className="mt-5 justify-center mb-3">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(page - 1);
                  }}
                  aria-disabled={page <= 1}
                />
              </PaginationItem>

              {pageNumbers.map((num, i) => (
                <PaginationItem key={i}>
                  {num === "…" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={num === page}
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(Number(num));
                      }}
                    >
                      {num}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(page + 1);
                  }}
                  aria-disabled={page >= data?.meta.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger></DialogTrigger>
        <Form {...form}>
          <DialogContent className="w-sm">
            <DialogTitle>Create user</DialogTitle>
            <div className="space-y-3 flex flex-col">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter name"
                        //   className="h-12 font-medium text-base bg-gray-50/60"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        //   className="h-12 font-medium text-base bg-gray-50/60"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter password"
                          className="h-12 font-medium text-base bg-gray-50/60"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <RadioGroup {...field} onValueChange={field.onChange}>
                        {info?.user?.role === "admin" && (
                          <>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="admin" id="r1" />
                              <Label htmlFor="r1">Admin</Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="manager" id="r2" />
                              <Label htmlFor="r2">Manager</Label>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="coach" id="r3" />
                          <Label htmlFor="r3">Coach</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="user" id="r4" />
                          <Label htmlFor="r4">Patient</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {requiresAssignment && !autoAssigned && (
                <FormField
                  control={form.control}
                  name="assignedCoach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Managed by</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={options}
                          placeholder="Select..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <DialogFooter>
              <Button
                center
                className="w-full"
                onClick={form.handleSubmit(onSubmit)}
                isLoading={isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Form>
      </Dialog>
    </AppLayout>
  );
}

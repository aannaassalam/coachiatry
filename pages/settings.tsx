import AddWatchers from "@/components/AddWatchers";
import PageTitle from "@/components/Seo/PageTitle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { updatePassword } from "@/external-api/functions/auth.api";
import {
  deleteCategory,
  getAllCategories
} from "@/external-api/functions/category.api";
import {
  deleteStatus,
  getAllStatuses
} from "@/external-api/functions/status.api";
import {
  getMyProfile,
  revokeViewAccess,
  updateProfile,
  updateProfilePicture
} from "@/external-api/functions/user.api";
import { Category } from "@/typescript/interface/category.interface";
import { Status } from "@/typescript/interface/status.interface";
import AppLayout from "@/layouts/AppLayout";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Link2, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as yup from "yup";
import { queryClient } from "./_app";

const schema = yup.object().shape({
  fullName: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required")
});

export default function Settings() {
  const { data, update } = useSession();

  const [password, setPassword] = useState<string>("");
  const [watchersDialog, setWatchersDialog] = useState(false);

  // Category deletion state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [replacementCategoryId, setReplacementCategoryId] =
    useState<string>("");

  // Status deletion state
  const [deletingStatus, setDeletingStatus] = useState<Status | null>(null);
  const [replacementStatusId, setReplacementStatusId] = useState<string>("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["settings-profile"],
    queryFn: getMyProfile
  });

  // Force-refresh on mount: the global QueryClient disables refetchOnMount,
  // so without this the lists are served from cache and a status/category
  // deleted elsewhere lingers here — clicking it then 404s.
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
    refetchOnMount: "always"
  });

  const { data: statuses, isLoading: isStatusesLoading } = useQuery({
    queryKey: ["status"],
    queryFn: getAllStatuses,
    refetchOnMount: "always"
  });

  const { mutate: deleteCategoryMutate, isPending: isDeletingCategory } =
    useMutation({
      mutationFn: deleteCategory,
      onSuccess: (res) => {
        if (res?.status === "requires_replacement") {
          return;
        }
        setDeletingCategory(null);
        setReplacementCategoryId("");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
      onError: (error: { response?: { status?: number } }) => {
        if (error?.response?.status === 404) {
          setDeletingCategory(null);
          setReplacementCategoryId("");
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.info("That category was already deleted.");
        }
      },
      meta: { showToast: false }
    });

  const { mutate: deleteStatusMutate, isPending: isDeletingStatus } =
    useMutation({
      mutationFn: deleteStatus,
      onSuccess: (res) => {
        if (res?.status === "requires_replacement") {
          return;
        }
        setDeletingStatus(null);
        setReplacementStatusId("");
        queryClient.invalidateQueries({ queryKey: ["status"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
      onError: (error: { response?: { status?: number } }) => {
        if (error?.response?.status === 404) {
          setDeletingStatus(null);
          setReplacementStatusId("");
          queryClient.invalidateQueries({ queryKey: ["status"] });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.info("That status was already deleted.");
        }
      },
      meta: { showToast: false }
    });

  const { mutate, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => update()
  });

  const { mutate: updatePicture, isPending: isPictureUpdating } = useMutation({
    mutationFn: updateProfilePicture,
    onSuccess: () => update()
  });

  const { mutate: mutatePassword, isPending: isPasswordUpdatePending } =
    useMutation({
      mutationFn: updatePassword,
      onSuccess: () => setPassword("")
    });

  const { mutate: revokeMutate, isPending: isRevoking } = useMutation({
    mutationFn: revokeViewAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    meta: {
      invalidateQueries: ["settings-profile"]
    }
  });

  // Watcher add/invite flow lives in the <AddWatchers /> component.

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: data?.user?.fullName,
      email: data?.user?.email
    },
    disabled: isPending
  });

  useEffect(() => {
    if (data?.user) {
      form.reset({
        fullName: data.user.fullName,
        email: data.user.email
      });
    }
  }, [data?.user, form]);

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    mutate(data);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
    setReplacementCategoryId("");
  };

  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;
    deleteCategoryMutate(
      {
        categoryId: deletingCategory._id,
        replacementCategoryId: replacementCategoryId || undefined
      },
      {
        onSuccess: (res) => {
          if (res?.status === "requires_replacement") {
            toast.error(
              `This category has ${res.taskCount} task(s). Please select a replacement category.`
            );
          }
        }
      }
    );
  };

  const handleDeleteStatus = (status: Status) => {
    setDeletingStatus(status);
    setReplacementStatusId("");
  };

  const confirmDeleteStatus = () => {
    if (!deletingStatus) return;
    deleteStatusMutate(
      {
        statusId: deletingStatus._id,
        replacementStatusId: replacementStatusId || undefined
      },
      {
        onSuccess: (res) => {
          if (res?.status === "requires_replacement") {
            toast.error(
              `This status has ${res.taskCount} task(s). Please select a replacement status.`
            );
          }
        }
      }
    );
  };

  const onUpdatePassword = () => {
    if (password && password.trim()) {
      mutatePassword({ password });
    }
  };

  const handleCopyShareLink = async () => {
    await navigator.clipboard.writeText(
      `${process.env.NEXTAUTH_URL}/share/user/${data?.user?.shareId}` || ""
    );
    toast.success("Link copied to clipboard!");
  };

  return (
    <AppLayout>
      <PageTitle title="Settings" />
      <div className="space-y-5">
        <h1 className="font-semibold text-gray-900 text-2xl leading-7 tracking-[-3%] max-sm:mb-4">
          Settings
        </h1>
        <Separator />
        <div className="space-y-6">
          <div className="border rounded-2xl p-5 space-y-7">
            <div className="flex items-center justify-between">
              <h2 className="font-lato font-semibold gap-5 text-lg tracking-[-2%]">
                Basic Information
              </h2>
              <Button
                variant="default"
                size="sm"
                onClick={form.handleSubmit(onSubmit)}
              >
                Save Changes
              </Button>
            </div>
            <Form {...form}>
              <div className="flex items-center gap-4 max-md:flex-col">
                <div className="relative size-20 mr-2 group">
                  <SmartAvatar
                    src={data?.user?.photo}
                    name={data?.user?.fullName}
                    key={data?.user?.updatedAt}
                    className="size-20"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    style={{ zIndex: 2 }}
                    disabled={isPictureUpdating}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updatePicture(file);
                      }
                    }}
                  />
                  <div
                    className={`absolute inset-0 bg-black/25 flex items-center justify-center rounded-full cursor-pointer transition-opacity z-1 ${
                      isPictureUpdating
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 pointer-events-none"
                    }`}
                  >
                    {isPictureUpdating ? (
                      // Replace with your loading spinner if you have one
                      <div className="relative flex items-center justify-center">
                        <svg
                          className="w-8 h-8 animate-spin"
                          viewBox="0 0 32 32"
                        >
                          <circle
                            cx="16"
                            cy="16"
                            r="12"
                            fill="none"
                            stroke="rgba(255,255,255,0.4)"
                            strokeWidth="4"
                          />
                          <path
                            // Arc for 60% of the circle (216 degrees)
                            d="M28 16
                              A12 12 0 0 1
                              16.97 27.85"
                            fill="none"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <Camera className="text-white" />
                    )}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5 flex-1 max-md:w-full">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter full name"
                          {...field}
                          className="h-12 font-bold text-base bg-gray-50/60"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  disabled
                  render={({ field }) => (
                    <FormItem className="space-y-0.5 flex-1 max-md:w-full">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          className="h-12 font-bold text-base bg-gray-50/60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem className="space-y-0.5 flex-1 max-md:w-full">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Enter password"
                        className="h-12 font-bold text-base bg-gray-50/60 pr-24"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute right-2 top-[7px] bg-white font-semibold"
                        isLoading={isPasswordUpdatePending}
                        onClick={onUpdatePassword}
                      >
                        Change
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            </Form>
          </div>
          <div className="border rounded-2xl">
            <div className="flex items-center justify-between p-5 pb-0 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <h2 className="font-lato font-semibold gap-5 text-lg tracking-[-2%] mb-2.5">
                Watchers
              </h2>
              <div className="flex items-center max-sm:justify-end gap-2 max-sm:self-end max-sm:w-full">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 font-semibold max-sm:w-max"
                  onClick={handleCopyShareLink}
                >
                  <Link2 />
                  Copy Link
                </Button>
                <Dialog
                  open={watchersDialog}
                  onOpenChange={(toggle) => setWatchersDialog(toggle)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5 font-semibold max-sm:w-max"
                      onClick={() => setWatchersDialog(true)}
                    >
                      <Plus />
                      Add Person
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Add Watchers</DialogTitle>
                    <AddWatchers
                      existingWatcherIds={
                        profile?.sharedViewers.map((_u) => _u._id) ?? []
                      }
                      onClose={() => setWatchersDialog(false)}
                      onSuccess={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["settings-profile"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["conversations"]
                        });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {isLoading ? (
              <div>
                <div className="flex items-center gap-3 py-5 px-6">
                  <div className="size-13 bg-gray-200 animate-pulse rounded-full" />
                  <div className="space-y-1">
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-sm" />
                    <div className="h-6 w-60 bg-gray-200 animate-pulse rounded-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3 py-5 px-6">
                  <div className="size-13 bg-gray-200 animate-pulse rounded-full" />
                  <div className="space-y-1">
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-sm" />
                    <div className="h-6 w-60 bg-gray-200 animate-pulse rounded-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3 py-5 px-6">
                  <div className="size-13 bg-gray-200 animate-pulse rounded-full" />
                  <div className="space-y-1">
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-sm" />
                    <div className="h-6 w-60 bg-gray-200 animate-pulse rounded-sm" />
                  </div>
                </div>
              </div>
            ) : Boolean(profile?.sharedViewers.length) ? (
              profile?.sharedViewers.map((_viewer) => {
                return (
                  <div
                    className="flex items-center gap-3 not-last:border-b py-5 px-6"
                    key={_viewer._id}
                  >
                    <SmartAvatar
                      src={_viewer.photo}
                      name={_viewer.fullName}
                      className="size-13 max-sm:size-10"
                    />
                    <div>
                      <p className="font-medium text-gray-800 leading-[150%] max-sm:text-sm">
                        {_viewer.fullName}
                      </p>
                      <p className="text-gray-700 leading-[150%] max-sm:text-xs">
                        {_viewer.email}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-semibold ml-auto bg-white"
                        >
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Do you want to revoke this user access to your
                            tasks?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            type="button"
                            disabled={isRevoking}
                          >
                            Close
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 text-white hover:bg-red-600 hover:text-white"
                            onClick={(e) => {
                              e.preventDefault();
                              revokeMutate(_viewer._id);
                            }}
                            disabled={isRevoking}
                          >
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-gray-400 italic text-sm">
                  You haven’t added any watchers
                </p>
              </div>
            )}
          </div>
          {/* Statuses & Categories side by side */}
          <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1 items-start mb-20">
            {/* Statuses */}
            <div className="border rounded-2xl">
              <div className="flex items-center justify-between p-5 pb-4">
                <h2 className="font-lato font-semibold text-lg tracking-[-2%]">
                  Statuses
                </h2>
              </div>
              <Separator />
              {isStatusesLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-4 px-5 not-last:border-b"
                    >
                      <div className="size-3 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : statuses && statuses.length > 0 ? (
                statuses.map((st) => (
                  <div
                    key={st._id}
                    className="flex items-center gap-3 py-3.5 px-5 not-last:border-b"
                  >
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: st.color.text }}
                    />
                    <span
                      className="text-sm font-medium font-lato"
                      style={{ color: st.color.text }}
                    >
                      {st.title}
                    </span>
                    {st.public && (
                      <span className="text-[10px] text-gray-400 font-archivo border rounded-full px-2 py-0.5 ml-1">
                        system
                      </span>
                    )}
                    {!st.public && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2.5"
                        onClick={() => handleDeleteStatus(st)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-gray-400 italic text-sm">
                    No statuses yet
                  </p>
                </div>
              )}
            </div>

            {/* Delete status dialog */}
            <Dialog
              open={!!deletingStatus}
              onOpenChange={(open) => {
                if (!open) {
                  setDeletingStatus(null);
                  setReplacementStatusId("");
                }
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogTitle>
                  Delete &ldquo;{deletingStatus?.title}&rdquo;
                </DialogTitle>
                <div className="space-y-4 py-1">
                  <p className="text-sm text-gray-600">
                    Tasks currently in this status will be moved to the
                    replacement status you select below. If no tasks use it, the
                    status will be deleted immediately.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Move tasks to
                    </label>
                    <Select
                      value={replacementStatusId}
                      onValueChange={setReplacementStatusId}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a replacement status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses
                          ?.filter((s) => s._id !== deletingStatus?._id)
                          .map((s) => (
                            <SelectItem key={s._id} value={s._id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: s.color.text }}
                                />
                                {s.title}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400">
                      Leave empty only if this status has no tasks.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isDeletingStatus}
                    onClick={() => {
                      setDeletingStatus(null);
                      setReplacementStatusId("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    isLoading={isDeletingStatus}
                    onClick={confirmDeleteStatus}
                    className="bg-red-500 text-white hover:bg-red-600 hover:text-white"
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Categories */}
            <div className="border rounded-2xl">
              <div className="flex items-center justify-between p-5 pb-4">
                <h2 className="font-lato font-semibold text-lg tracking-[-2%]">
                  Categories
                </h2>
              </div>
              <Separator />
              {isCategoriesLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-4 px-5 not-last:border-b"
                    >
                      <div className="size-3 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center gap-3 py-3.5 px-5 not-last:border-b"
                  >
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color.text }}
                    />
                    <span
                      className="text-sm font-medium font-lato"
                      style={{ color: cat.color.text }}
                    >
                      {cat.title}
                    </span>
                    {cat.public && (
                      <span className="text-[10px] text-gray-400 font-archivo border rounded-full px-2 py-0.5 ml-1">
                        system
                      </span>
                    )}
                    {!cat.public && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2.5"
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-gray-400 italic text-sm">
                    No categories yet
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* /Statuses & Categories grid */}

          {/* Delete category dialog */}
          <Dialog
            open={!!deletingCategory}
            onOpenChange={(open) => {
              if (!open) {
                setDeletingCategory(null);
                setReplacementCategoryId("");
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogTitle>
                Delete &ldquo;{deletingCategory?.title}&rdquo;
              </DialogTitle>
              <div className="space-y-4 py-1">
                <p className="text-sm text-gray-600">
                  Tasks currently in this category will be moved to the
                  replacement category you select below. If no tasks use it, the
                  category will be deleted immediately.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Move tasks to
                  </label>
                  <Select
                    value={replacementCategoryId}
                    onValueChange={setReplacementCategoryId}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a replacement category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        ?.filter((c) => c._id !== deletingCategory?._id)
                        .map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="size-2 rounded-full"
                                style={{ backgroundColor: c.color.text }}
                              />
                              {c.title}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Leave empty only if this category has no tasks.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeletingCategory}
                  onClick={() => {
                    setDeletingCategory(null);
                    setReplacementCategoryId("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  isLoading={isDeletingCategory}
                  onClick={confirmDeleteCategory}
                  className="bg-red-500 text-white hover:bg-red-600 hover:text-white"
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  );
}

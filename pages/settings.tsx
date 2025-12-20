import MultiSelectUsers from "@/components/MultiSelectUsers";
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
import { Separator } from "@/components/ui/separator";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { updatePassword } from "@/external-api/functions/auth.api";
import {
  addWatchers,
  getMyProfile,
  revokeViewAccess,
  updateProfile,
  updateProfilePicture
} from "@/external-api/functions/user.api";
import AppLayout from "@/layouts/AppLayout";
import { getInitials } from "@/lib/functions/_helpers.lib";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Link2, Plus } from "lucide-react";
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [watchersDialog, setWatchersDialog] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["settings-profile"],
    queryFn: getMyProfile
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

  const { mutate: watchersMutate, isPending: isAdding } = useMutation({
    mutationFn: addWatchers,
    onSuccess: () => {
      setWatchersDialog(false);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    meta: {
      invalidateQueries: ["settings-profile"]
    }
  });

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
              <div className="flex items-center gap-2 max-sm:self-end max-sm:w-full max-sm:grid max-sm:grid-cols-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 font-semibold"
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
                      className="gap-1.5 font-semibold"
                      onClick={() => setWatchersDialog(true)}
                    >
                      <Plus />
                      Add Person
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Add Watchers</DialogTitle>
                    <div className="p-2.5">
                      <MultiSelectUsers
                        selectedUsers={selectedUsers}
                        onChange={setSelectedUsers}
                        existingUsers={
                          profile?.sharedViewers.map((_u) => _u._id) ?? []
                        }
                        disabled={isAdding}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isAdding}
                        onClick={() => setWatchersDialog(false)}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          watchersMutate(selectedUsers);
                        }}
                        size="sm"
                        isLoading={isAdding}
                        disabled={selectedUsers.length === 0}
                      >
                        Add
                      </Button>
                    </DialogFooter>
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
                      name={getInitials(_viewer.fullName)}
                      textSize="text-lg"
                      className="size-13"
                    />
                    <div>
                      <p className="font-medium text-gray-800 leading-[150%]">
                        {_viewer.fullName}
                      </p>
                      <p className="text-gray-700 leading-[150%]">
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
        </div>
      </div>
    </AppLayout>
  );
}

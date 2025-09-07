import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link2, Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 6 characters")
    .default(null)
});

export default function Settings() {
  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: ""
    }
  });
  return (
    <AppLayout>
      <div className="space-y-5">
        <h1 className="font-semibold text-gray-900 text-2xl leading-7 tracking-[-3%]">
          Settings
        </h1>
        <Separator />
        <div className="space-y-6">
          <div className="border rounded-2xl p-5 space-y-7">
            <div className="flex items-center justify-between">
              <h2 className="font-lato font-semibold gap-5 text-lg tracking-[-2%]">
                Basic Information
              </h2>
              <Button variant="default" size="sm">
                Save Changes
              </Button>
            </div>
            <Form {...form}>
              <div className="flex items-center gap-4">
                <Avatar className="size-20 mr-2">
                  <AvatarImage src={assets.avatar} alt="AH" />
                  <AvatarFallback>AH</AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5 flex-1">
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
                  render={({ field }) => (
                    <FormItem className="space-y-0.5 flex-1">
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5 flex-1">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Enter password"
                            className="h-12 font-bold text-base bg-gray-50/60 pr-24"
                            {...field}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute right-2 top-[7px] bg-white font-semibold"
                          >
                            Change
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </div>
          <div className="border rounded-2xl">
            <div className="flex items-center justify-between p-5 pb-0">
              <h2 className="font-lato font-semibold gap-5 text-lg tracking-[-2%] mb-2.5">
                Watchers
              </h2>
              <div className="flex items-center gap-2 5">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 font-semibold"
                >
                  <Link2 />
                  Copy Link
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 font-semibold"
                >
                  <Plus />
                  Add Person
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 not-last:border-b py-5 px-6">
              <Avatar className="size-13">
                <AvatarImage src={assets.avatar} alt="AH" />
                <AvatarFallback>AH</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-800 leading-[150%]">Mom</p>
                <p className="text-gray-700 leading-[150%]">
                  riya.mom@gmail.com
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-semibold ml-auto bg-white"
              >
                Revoke
              </Button>
            </div>
            <div className="flex items-center gap-3 not-last:border-b py-5 px-6">
              <Avatar className="size-13">
                <AvatarImage src={assets.avatar} alt="AH" />
                <AvatarFallback>AH</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-800 leading-[150%]">Mom</p>
                <p className="text-gray-700 leading-[150%]">
                  riya.mom@gmail.com
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-semibold ml-auto bg-white"
              >
                Revoke
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

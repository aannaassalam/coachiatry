"use client";

import { signup } from "@/api/functions/auth.api";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import assets from "@/json/assets";
import AuthLayout from "@/layouts/AuthLayout";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object().shape({
  fullName: yup.string().required(),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 6 characters")
    .required("Password is required")
});

export default function Register() {
  const { mutate, isPending } = useMutation({
    mutationFn: signup,
    onSuccess: (_data, variables) => {
      signIn("credentials", {
        email: variables.email,
        password: variables.password,
        callbackUrl: "/"
      });
    }
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: ""
    },
    disabled: isPending
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    mutate(data);
  };

  return (
    <AuthLayout className="flex items-center justify-center">
      <Card className="w-full max-w-lg py-9" key="register-card">
        <CardHeader className="text-center">
          <h1 className="font-semibold text-[32px] leading-10 tracking-[-3%] text-primary-text">
            Create your account
          </h1>
          <p className="text-muted-foreground">
            Enter the fields below to get started
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
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
                          placeholder="Enter email address"
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
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isPending}>
                Create account
              </Button>
            </form>
          </Form>
          <div className="flex items-center gap-3 mt-5">
            <Separator className="flex-1" />
            <p className="text-center text-sm text-muted-foreground font-medium">
              or
            </p>
            <Separator className="flex-1" />
          </div>
          <Button variant="outline" className="w-full mt-4">
            <Image
              src={assets.google_logo}
              alt="Google"
              width={20}
              height={20}
            />
            Sign up with Google
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

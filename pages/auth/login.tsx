"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 6 characters")
    .required("Password is required"),
  rememberMe: yup.boolean().required().default(false)
});

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  console.log(
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXTAUTH_SECRET
  );

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    },
    disabled: isLoading
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    setIsLoading(true);
    signIn("credentials", { ...data, callbackUrl: "/" });
    setIsLoading(false);
  };

  return (
    <AuthLayout className="flex items-center justify-center">
      <Card className="w-full max-w-lg py-9" key="login-card">
        <CardHeader className="text-center">
          <h1 className="font-semibold text-[32px] leading-10 tracking-[-3%] text-primary-text">
            Login to account
          </h1>
          <p className="text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
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
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/auth/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Remember machine for 30 days
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Login
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
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

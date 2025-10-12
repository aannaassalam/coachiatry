"use client";

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
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword } from "@/external-api/functions/auth.api";
import AuthLayout from "@/layouts/AuthLayout";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object().shape({
  password: yup.string().required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), ""], "Passwords must match")
    .required("Confirm password is required")
});

export default function ResetPassword() {
  const router = useRouter();
  const { token } = useParams();

  const { mutate, isPending } = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => router.push("/auth/login")
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    },
    disabled: isPending
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    mutate({ token: token?.toString() ?? "", password: data.password });
  };

  return (
    <AuthLayout className="flex items-center justify-center">
      <Card className="w-full max-w-lg py-9 max-sm:max-w-[95%]">
        <CardHeader className="text-center">
          <h1 className="font-semibold text-[32px] leading-10 tracking-[-3%] text-primary-text">
            Reset Password
          </h1>
          <p className="text-muted-foreground">
            Enter your new password to reset your account password
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                center
                isLoading={isPending}
              >
                Reset password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

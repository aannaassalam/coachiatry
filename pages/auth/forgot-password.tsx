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
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/external-api/functions/auth.api";
import AuthLayout from "@/layouts/AuthLayout";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required")
});

export default function ForgotPassword() {
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      router.push("/auth/login");
    }
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: ""
    },
    disabled: isPending
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    mutate(data.email);
  };

  return (
    <AuthLayout className="flex items-center justify-center">
      <Card className="w-full max-w-lg py-9 max-sm:max-w-[95%]">
        <CardHeader className="text-center">
          <h1 className="font-semibold text-[32px] leading-10 tracking-[-3%] text-primary-text">
            Forgot Password
          </h1>
          <p className="text-muted-foreground">
            Enter your email to receive password reset instructions
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
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
              <Button
                type="submit"
                className="w-full"
                center
                isLoading={isPending}
              >
                Submit
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

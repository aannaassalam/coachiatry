import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "@/components/ui/input-otp";
import { verifyOtp } from "@/external-api/functions/auth.api";
import AuthLayout from "@/layouts/AuthLayout";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const email = context.query?.email;

  if (!email) {
    return {
      redirect: {
        destination: `/auth/signup`,
        permanent: true
      }
    };
  }

  return { props: {} };
};

export default function Verification() {
  const router = useRouter();
  const { email } = router.query;
  const [local_callback] = useQueryState(
    "local_callback",
    parseAsString.withDefault("")
  );
  const [value, setValue] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: verifyOtp,
    onSuccess: () => {
      //   signIn("credentials", {
      //     email: data.data.user.email,
      //     password: (data.data.user as any).password,
      //     callbackUrl: local_callback || "/"
      //   });
      router.push(`/auth/login?local_callback=${local_callback}`);
    }
  });

  const onSubmit = () => {
    mutate({
      email: email?.toString() ?? "",
      otp: value
    });
  };

  return (
    <AuthLayout className="flex items-center justify-center">
      <Card className="w-full max-w-lg py-9 max-sm:max-w-[95%]">
        <CardHeader className="text-center">
          <h1 className="font-semibold text-[32px] leading-10 tracking-[-3%] text-primary-text">
            OTP Verification
          </h1>
          <p className="text-muted-foreground">
            Enter the otp sent over to {email}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-8">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={value}
              onChange={(value) => setValue(value)}
              disabled={isPending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-white!" />
                <InputOTPSlot index={1} className="bg-white!" />
                <InputOTPSlot index={2} className="bg-white!" />
                <InputOTPSlot index={3} className="bg-white!" />
                <InputOTPSlot index={4} className="bg-white!" />
                <InputOTPSlot index={5} className="bg-white!" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={onSubmit}
            className="w-full"
            center
            isLoading={isPending}
          >
            Submit
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

import assets from "@/json/assets";
import { cx } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import React from "react";

export default function Logo(
  props: Omit<ImageProps, "src" | "alt"> & { mobile?: boolean }
) {
  const { className, mobile, ...others } = props;
  return (
    <>
      <Image
        src={assets.logo_mobile}
        alt="StackWalls"
        {...others}
        className={cx(className, {
          "max-sm:block hidden": mobile,
          hidden: !mobile
        })}
        width={32}
        height={32}
      />
      <Image
        src={assets.logo2}
        alt="StackWalls"
        width={229}
        height={48}
        {...others}
        className={cx(className, {
          "max-sm:hidden": mobile
        })}
      />
    </>
  );
}

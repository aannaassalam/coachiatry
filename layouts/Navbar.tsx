import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import assets from "@/json/assets";
import Logo from "@/ui/Logo/Logo";
import { Menu, Search } from "lucide-react";
import { getInitials } from "@/lib/functions/_helpers.lib";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import CoachAI from "@/components/CoachAIPopover";

export default function Navbar({
  navOpen,
  setNavOpen
}: {
  navOpen: boolean;
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { data } = useSession();

  return (
    <div className="px-12 py-5 flex items-center justify-end gap-6 max-lg:px-7 max-sm:py-4 max-sm:pl-4 max-sm:gap-8">
      <div className="lg:hidden mr-auto">
        <Logo />
      </div>

      <div className="border rounded-xl overflow-hidden flex max-sm:hidden">
        <div className="bg-white flex items-center pl-2.5">
          <Search className="text-gray-500 size-4.5" />
          <input
            type="text"
            className="py-2.5 pl-1 pr-2 text-gray-900 placeholder:text-gray-500 font-lato text-sm outline-none min-w-52.5 max-lg:!min-w-0 max-lg:w-30"
            placeholder="Search"
          />
        </div>
        <Popover modal>
          <PopoverTrigger asChild>
            <div className="px-2.5 flex items-center gap-2 shrink-0">
              <Image src={assets.ai} alt="AI" width={24} height={24} />
              <p className="text-gray-900 font-semibold text-sm leading-4.5 max-md:hidden">
                Coach AI
              </p>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="border-none shadow-none bg-transparent"
            side="bottom"
            align="center"
            collisionPadding={180}
          >
            <CoachAI size="large" />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-3">
        <SmartAvatar
          src={data?.user?.photo}
          name={data?.user?.fullName}
          key={data?.user?.updatedAt}
          className="size-8"
          textSize="text-sm"
        />
        <Popover>
          <PopoverTrigger>
            <div className="cursor-pointer text-left">
              <p className="font-semibold text-gray-900 text-xs leading-4.5">
                {data?.user?.fullName}
              </p>
              <p className="text-gray-700 text-xs leading-4">
                {data?.user?.email}
              </p>
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-max">
            <Button onClick={() => signOut({ callbackUrl: "/auth/login" })}>
              Logout
            </Button>
          </PopoverContent>
        </Popover>
      </div>
      <Menu
        className="lg:hidden cursor-pointer shrink-0"
        onClick={() => setNavOpen(!navOpen)}
      />
    </div>
  );
}

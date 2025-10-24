import {
  DialogClose,
  //   DialogTrigger,
  DialogContent
} from "@/components/ui/dialog";
import { User } from "@/typescript/interface/user.interface";
import Link from "next/link";
import { Button } from "../ui/button";
import { SmartAvatar } from "../ui/smart-avatar";

function ProfileModal({ client }: { client: User }) {
  return (
    <DialogContent
      className={`sm:max-w-[460px] p-0 border-0 focus-visible:border-0`}
      showCloseButton={false}
    >
      <div className="w-full p-5 flex flex-col items-center gap-0">
        <SmartAvatar
          src={client.photo}
          name={client.fullName}
          className="size-21 mt-6"
        />
        <p className="text-[20px] font-semibold text-gray-900 mt-4">
          {client.fullName}
        </p>
        <p className="text-base text-gray-600">{client.email}</p>
        <div className="mt-8 gap-4 w-full grid grid-cols-2">
          <DialogClose>
            <Button
              className="bg-gray-200 text-gray-900 hover:bg-gray-300 hover:text-gray-900"
              center
              asChild
            >
              Cancel
            </Button>
          </DialogClose>
          <Link href={`/clients/${client._id}`}>
            <Button className="w-full" center>
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </DialogContent>
  );
}

export default ProfileModal;

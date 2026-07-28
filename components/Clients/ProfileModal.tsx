import {
  DialogClose,
  //   DialogTrigger,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { User } from "@/typescript/interface/user.interface";
import moment from "moment";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { SmartAvatar } from "../ui/smart-avatar";
import { roleLabel } from "@/lib/functions/_helpers.lib";

// One labelled field. Renders "—" for anything the API left empty so the grid
// keeps its shape instead of collapsing rows.
const Field = ({
  label,
  children
}: {
  label: string;
  children?: React.ReactNode;
}) => (
  <div className="min-w-0">
    <p className="text-xs text-gray-500 font-lato">{label}</p>
    <div className="text-sm text-gray-900 font-lato truncate mt-0.5">
      {children || <span className="text-gray-400">—</span>}
    </div>
  </div>
);

function ProfileModal({ client }: { client: User }) {
  const watchers = client.sharedViewers?.length ?? 0;

  return (
    <DialogContent
      className={`sm:max-w-[520px] p-0 border-0 focus-visible:border-0`}
      showCloseButton={false}
    >
      <DialogTitle className="sr-only">{client.fullName}</DialogTitle>
      <div className="w-full p-5 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <SmartAvatar
            src={client.photo}
            name={client.fullName}
            className="size-16 rounded-[12px]"
          />
          <div className="min-w-0">
            <p className="text-[18px] font-semibold text-gray-900 truncate">
              {client.fullName}
            </p>
            <Link
              href={`mailto:${client.email}`}
              className="text-sm text-gray-600 hover:text-gray-900 truncate block"
            >
              {client.email}
            </Link>
            <div className="flex items-center gap-1.5 mt-2">
              {client.role && (
                <Badge variant="secondary" className="capitalize">
                  {roleLabel(client.role)}
                </Badge>
              )}
              <Badge
                variant={client.active === false ? "outline" : "secondary"}
              >
                {client.active === false ? "Inactive" : "Active"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-gray-100 pt-4">
          <Field label="Phone">
            {client.phone && (
              <Link href={`tel:${client.phone}`} className="hover:text-primary">
                {client.phone}
              </Link>
            )}
          </Field>
          <Field label="Joined">
            {client.createdAt &&
              moment(client.createdAt).format("MMM DD, YYYY")}
          </Field>
          <Field label="Last updated">
            {client.updatedAt && moment(client.updatedAt).fromNow()}
          </Field>
          <Field label="Watchers">
            {watchers > 0
              ? `${watchers} shared viewer${watchers > 1 ? "s" : ""}`
              : null}
          </Field>
        </div>

        <div className="gap-4 w-full grid grid-cols-2">
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

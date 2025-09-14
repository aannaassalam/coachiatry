import { TableCell, TableRow } from "../ui/table";

export default function EmptyTable({
  message = "No records found",
  colSpan
}: {
  message?: string;
  colSpan: number;
}) {
  return (
    <TableRow className="bg-white">
      <TableCell
        className="text-center py-4 italic text-gray-500"
        colSpan={colSpan}
      >
        {message}
      </TableCell>
    </TableRow>
  );
}

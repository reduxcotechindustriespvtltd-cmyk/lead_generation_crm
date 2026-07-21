import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = { name: string; bookings: number; revenue: number };

export function EarningsBreakdownTable({
  title,
  nameLabel,
  rows,
}: {
  title: string;
  nameLabel: string;
  rows: Row[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{nameLabel}</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground h-20 text-center">
                  No data yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="max-w-[220px] truncate font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.bookings}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{row.revenue.toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

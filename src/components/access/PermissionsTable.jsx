import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";

const PERMISSIONS = [
  {
    feature: "Leads",
    permissions: ["View", "Edit"],
    admin: true,
    user: true,
  },
  {
    feature: "Activities",
    permissions: ["Add"],
    admin: true,
    user: true,
  },
  {
    feature: "Reminders",
    permissions: ["View", "Create"],
    admin: true,
    user: true,
  },
  {
    feature: "Deposits",
    permissions: ["Add (own leads)"],
    admin: true,
    user: true,
  },
  {
    feature: "Reports",
    permissions: ["View"],
    admin: true,
    user: false,
  },
  {
    feature: "User Management",
    permissions: ["Manage"],
    admin: true,
    user: false,
  },
  {
    feature: "Settings",
    permissions: ["Access"],
    admin: true,
    user: false,
  },
];

export default function PermissionsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((perm) => (
              <TableRow key={perm.feature}>
                <TableCell className="font-medium">{perm.feature}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {perm.permissions.join(", ")}
                </TableCell>
                <TableCell className="text-center">
                  {perm.admin ? (
                    <Check className="w-5 h-5 text-green-600 inline" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 inline" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {perm.user ? (
                    <Check className="w-5 h-5 text-green-600 inline" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 inline" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
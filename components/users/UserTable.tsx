"use client"

import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteUserDialog } from "./DeleteUserDialog"
import { useState } from "react"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Pagination } from "@/components/ui/Pagination"
import type { SortDir } from "@/lib/listQuery"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
}

interface UserTableProps {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  sort: string
  dir: SortDir
  basePath: string
  searchParams: Record<string, string | string[] | undefined>
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800"
    case "ANALYST":
      return "bg-blue-100 text-blue-800"
    case "QA":
      return "bg-yellow-100 text-yellow-800"
    case "MILL_OWNER":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function UserTable({
  users,
  total,
  page,
  pageSize,
  totalPages,
  sort,
  dir,
  basePath,
  searchParams,
}: UserTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = (userId: string) => {
    setSelectedUserId(userId)
    setShowDeleteDialog(true)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              label="Name"
              sortKey="name"
              currentSort={sort}
              currentDir={dir}
              basePath={basePath}
              searchParams={searchParams}
            />
            <SortableTableHead
              label="Email"
              sortKey="email"
              currentSort={sort}
              currentDir={dir}
              basePath={basePath}
              searchParams={searchParams}
            />
            <SortableTableHead
              label="Role"
              sortKey="role"
              currentSort={sort}
              currentDir={dir}
              basePath={basePath}
              searchParams={searchParams}
            />
            <SortableTableHead
              label="Created"
              sortKey="createdAt"
              currentSort={sort}
              currentDir={dir}
              basePath={basePath}
              searchParams={searchParams}
              defaultDir="desc"
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name || "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link
                    href={`/dashboard/users/${user.id}/edit`}
                    className={buttonVariants({ variant: "ghost", size: "icon" })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className={buttonVariants({ variant: "ghost", size: "icon" })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        basePath={basePath}
        searchParams={searchParams}
      />

      {selectedUserId && (
        <DeleteUserDialog
          userId={selectedUserId}
          userName={users.find((u) => u.id === selectedUserId)?.name || "User"}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      )}
    </>
  )
}

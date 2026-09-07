import { Permission, Role } from 'node-appwrite'

export function privateCollectionPermissions() {
  return {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.users())],
  }
}

export function serverOnlyCollectionPermissions() {
  return { read: [], write: [] }
}

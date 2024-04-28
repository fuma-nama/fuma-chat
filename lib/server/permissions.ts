export const Permissions = {
    None: 0,
    DeleteMessage: 2 ^ 0,
    Kick: 2 ^ 1,
    Admin: 2 ^ 1 | 2 ^ 0,
}

export function hasPermission(permission: number, check: number): boolean {
    return (permission & check) === check
}
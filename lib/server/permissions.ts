export const Permissions = {
    None: 0,
    DeleteMessage: 1,
    Kick: 2,
    Invite: Math.pow(2, 2),

    Admin: Math.pow(2, 3),
}

export function hasPermission(permission: number, check: number): boolean {
    return (permission & check) === check
}
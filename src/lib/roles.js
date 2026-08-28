export const ROLES_STAFF = ["mantenedor", "supervisor", "admin"];
export const ROLES_SUPERVISOR = ["supervisor", "admin"];

export function isStaff(rol) {
  return ROLES_STAFF.includes(rol);
}

export function isSupervisor(rol) {
  return ROLES_SUPERVISOR.includes(rol);
}

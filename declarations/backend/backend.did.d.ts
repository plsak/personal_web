import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BlogPost {
  'id' : bigint,
  'title' : string,
  'content' : string,
  'author' : Principal,
  'timestamp' : Time,
}
export interface CaffeineInfo { 'content' : string, 'lastUpdated' : Time }
export type Time = bigint;
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface WebLink {
  'id' : bigint,
  'url' : string,
  'title' : string,
  'description' : string,
}
export interface _SERVICE {
  'addBlogPost' : ActorMethod<[string, string], undefined>,
  'addWebLink' : ActorMethod<[string, string, string], undefined>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'deleteBlogPost' : ActorMethod<[bigint], undefined>,
  'deleteWebLink' : ActorMethod<[bigint], undefined>,
  'editBlogPost' : ActorMethod<[bigint, string, string], undefined>,
  'editWebLink' : ActorMethod<[bigint, string, string, string], undefined>,
  'getAllAdminPrincipals' : ActorMethod<[], Array<Principal>>,
  'getAllBlogPosts' : ActorMethod<[], Array<BlogPost>>,
  'getAllWebLinks' : ActorMethod<[], Array<WebLink>>,
  'getCaffeineInfo' : ActorMethod<[], [] | [CaffeineInfo]>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getOrderedWebLinks' : ActorMethod<[], Array<WebLink>>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'getVisitCount' : ActorMethod<[], bigint>,
  'incrementVisitCount' : ActorMethod<[], undefined>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'reorderWebLinks' : ActorMethod<[Array<bigint>], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'updateCaffeineInfo' : ActorMethod<[string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];

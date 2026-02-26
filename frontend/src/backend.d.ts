import { type HttpAgentOptions, type ActorConfig, type Agent } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";
import { CreateActorOptions } from "declarations/backend";
import { _SERVICE } from "declarations/backend/backend.did.d.js";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WebLink {
    id: bigint;
    url: string;
    title: string;
    description: string;
}
export interface CaffeineInfo {
    content: string;
    lastUpdated: Time;
}
export interface BlogPost {
    id: bigint;
    title: string;
    content: string;
    author: Principal;
    timestamp: Time;
}
export type Time = bigint;
export interface UserProfile {
    name: string;
}
export declare const createActor: (canisterId: string | Principal, options?: CreateActorOptions, processError?: (error: unknown) => never) => backendInterface;
export declare const canisterId: string;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBlogPost(title: string, content: string): Promise<void>;
    addWebLink(title: string, url: string, description: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteBlogPost(id: bigint): Promise<void>;
    deleteWebLink(id: bigint): Promise<void>;
    editBlogPost(id: bigint, title: string, content: string): Promise<void>;
    editWebLink(id: bigint, title: string, url: string, description: string): Promise<void>;
    getAllAdminPrincipals(): Promise<Array<Principal>>;
    getAllBlogPosts(): Promise<Array<BlogPost>>;
    getAllWebLinks(): Promise<Array<WebLink>>;
    getCaffeineInfo(): Promise<CaffeineInfo | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrderedWebLinks(): Promise<Array<WebLink>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisitCount(): Promise<bigint>;
    incrementVisitCount(): Promise<void>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    reorderWebLinks(newOrder: Array<bigint>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCaffeineInfo(content: string): Promise<void>;
}


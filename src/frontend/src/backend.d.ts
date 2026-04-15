import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BlogPost {
    id: bigint;
    title: string;
    content: string;
    author: Principal;
    timestamp: Time;
}
export type Time = bigint;
export interface HeadingConfig {
    font: string;
    color: string;
    text: string;
}
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
export interface CaffeineInfoScreenRecord {
    id: string;
    title: string;
    content: string;
    order: bigint;
}
export interface UserProfile {
    name: string;
}
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
    getCaffeineInfoConfig(): Promise<{
        screens: Array<CaffeineInfoScreenRecord>;
        sectionTitle: string;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHeadingConfig(): Promise<HeadingConfig>;
    getOrderedWebLinks(): Promise<Array<WebLink>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisitCount(): Promise<bigint>;
    incrementVisitCount(): Promise<void>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    reorderWebLinks(newOrder: Array<bigint>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCaffeineInfo(content: string): Promise<void>;
    updateCaffeineInfoConfig(sectionTitle: string, screens: Array<CaffeineInfoScreenRecord>): Promise<void>;
    updateHeadingConfig(text: string, font: string, color: string): Promise<void>;
}

import { type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";
import { backend as _backend, createActor as _createActor, canisterId as _canisterId, CreateActorOptions } from "declarations/backend";
import { _SERVICE } from "declarations/backend/backend.did.d.js";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
function some<T>(value: T): Some<T> {
    return {
        __kind__: "Some",
        value: value
    };
}
function none(): None {
    return {
        __kind__: "None"
    };
}
function isNone<T>(option: Option<T>): option is None {
    return option.__kind__ === "None";
}
function isSome<T>(option: Option<T>): option is Some<T> {
    return option.__kind__ === "Some";
}
function unwrap<T>(option: Option<T>): T {
    if (isNone(option)) {
        throw new Error("unwrap: none");
    }
    return option.value;
}
function candid_some<T>(value: T): [T] {
    return [
        value
    ];
}
function candid_none<T>(): [] {
    return [];
}
function record_opt_to_undefined<T>(arg: T | null): T | undefined {
    return arg == null ? undefined : arg;
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
export function createActor(canisterId: string | Principal, options?: CreateActorOptions, processError?: (error: unknown) => never): backendInterface {
    const actor = _createActor(canisterId, options);
    return new Backend(actor, processError);
}
export const canisterId = _canisterId;
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
import type { CaffeineInfo as _CaffeineInfo, UserProfile as _UserProfile, UserRole as _UserRole } from "declarations/backend/backend.did.d.ts";
class Backend implements backendInterface {
    private actor: ActorSubclass<_SERVICE>;
    constructor(actor?: ActorSubclass<_SERVICE>, private processError?: (error: unknown) => never){
        this.actor = actor ?? _backend;
    }
    async addBlogPost(arg0: string, arg1: string): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.addBlogPost(arg0, arg1);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.addBlogPost(arg0, arg1);
            return result;
        }
    }
    async addWebLink(arg0: string, arg1: string, arg2: string): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.addWebLink(arg0, arg1, arg2);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.addWebLink(arg0, arg1, arg2);
            return result;
        }
    }
    async assignCallerUserRole(arg0: Principal, arg1: UserRole): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.assignCallerUserRole(arg0, to_candid_UserRole_n1(arg1));
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.assignCallerUserRole(arg0, to_candid_UserRole_n1(arg1));
            return result;
        }
    }
    async deleteBlogPost(arg0: bigint): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.deleteBlogPost(arg0);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.deleteBlogPost(arg0);
            return result;
        }
    }
    async deleteWebLink(arg0: bigint): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.deleteWebLink(arg0);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.deleteWebLink(arg0);
            return result;
        }
    }
    async editBlogPost(arg0: bigint, arg1: string, arg2: string): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.editBlogPost(arg0, arg1, arg2);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.editBlogPost(arg0, arg1, arg2);
            return result;
        }
    }
    async editWebLink(arg0: bigint, arg1: string, arg2: string, arg3: string): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.editWebLink(arg0, arg1, arg2, arg3);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.editWebLink(arg0, arg1, arg2, arg3);
            return result;
        }
    }
    async getAllAdminPrincipals(): Promise<Array<Principal>> {
        if (this.processError) {
            try {
                const result = await this.actor.getAllAdminPrincipals();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getAllAdminPrincipals();
            return result;
        }
    }
    async getAllBlogPosts(): Promise<Array<BlogPost>> {
        if (this.processError) {
            try {
                const result = await this.actor.getAllBlogPosts();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getAllBlogPosts();
            return result;
        }
    }
    async getAllWebLinks(): Promise<Array<WebLink>> {
        if (this.processError) {
            try {
                const result = await this.actor.getAllWebLinks();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getAllWebLinks();
            return result;
        }
    }
    async getCaffeineInfo(): Promise<CaffeineInfo | null> {
        if (this.processError) {
            try {
                const result = await this.actor.getCaffeineInfo();
                return from_candid_opt_n3(result);
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getCaffeineInfo();
            return from_candid_opt_n3(result);
        }
    }
    async getCallerUserProfile(): Promise<UserProfile | null> {
        if (this.processError) {
            try {
                const result = await this.actor.getCallerUserProfile();
                return from_candid_opt_n4(result);
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getCallerUserProfile();
            return from_candid_opt_n4(result);
        }
    }
    async getCallerUserRole(): Promise<UserRole> {
        if (this.processError) {
            try {
                const result = await this.actor.getCallerUserRole();
                return from_candid_UserRole_n5(result);
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getCallerUserRole();
            return from_candid_UserRole_n5(result);
        }
    }
    async getOrderedWebLinks(): Promise<Array<WebLink>> {
        if (this.processError) {
            try {
                const result = await this.actor.getOrderedWebLinks();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getOrderedWebLinks();
            return result;
        }
    }
    async getUserProfile(arg0: Principal): Promise<UserProfile | null> {
        if (this.processError) {
            try {
                const result = await this.actor.getUserProfile(arg0);
                return from_candid_opt_n4(result);
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getUserProfile(arg0);
            return from_candid_opt_n4(result);
        }
    }
    async getVisitCount(): Promise<bigint> {
        if (this.processError) {
            try {
                const result = await this.actor.getVisitCount();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getVisitCount();
            return result;
        }
    }
    async incrementVisitCount(): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.incrementVisitCount();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.incrementVisitCount();
            return result;
        }
    }
    async initializeAccessControl(): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.initializeAccessControl();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.initializeAccessControl();
            return result;
        }
    }
    async isCallerAdmin(): Promise<boolean> {
        if (this.processError) {
            try {
                const result = await this.actor.isCallerAdmin();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.isCallerAdmin();
            return result;
        }
    }
    async reorderWebLinks(arg0: Array<bigint>): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.reorderWebLinks(arg0);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.reorderWebLinks(arg0);
            return result;
        }
    }
    async saveCallerUserProfile(arg0: UserProfile): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.saveCallerUserProfile(arg0);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.saveCallerUserProfile(arg0);
            return result;
        }
    }
    async updateCaffeineInfo(arg0: string): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.updateCaffeineInfo(arg0);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.updateCaffeineInfo(arg0);
            return result;
        }
    }
}
export const backend: backendInterface = new Backend();
function from_candid_UserRole_n5(value: _UserRole): UserRole {
    return from_candid_variant_n6(value);
}
function from_candid_opt_n3(value: [] | [_CaffeineInfo]): CaffeineInfo | null {
    return value.length === 0 ? null : value[0];
}
function from_candid_opt_n4(value: [] | [_UserProfile]): UserProfile | null {
    return value.length === 0 ? null : value[0];
}
function from_candid_variant_n6(value: {
    admin: null;
} | {
    user: null;
} | {
    guest: null;
}): UserRole {
    return "admin" in value ? UserRole.admin : "user" in value ? UserRole.user : "guest" in value ? UserRole.guest : value;
}
function to_candid_UserRole_n1(value: UserRole): _UserRole {
    return to_candid_variant_n2(value);
}
function to_candid_variant_n2(value: UserRole): {
    admin: null;
} | {
    user: null;
} | {
    guest: null;
} {
    return value == UserRole.admin ? {
        admin: null
    } : value == UserRole.user ? {
        user: null
    } : value == UserRole.guest ? {
        guest: null
    } : value;
}


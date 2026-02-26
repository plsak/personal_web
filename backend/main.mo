import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Time "mo:base/Time";
import Text "mo:base/Text";
import List "mo:base/List";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Array "mo:base/Array";

persistent actor {
    // Initialize the user system state
    let accessControlState = AccessControl.initState();

    // Initialize auth (first caller becomes admin, others become users)
    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public type UserProfile = {
        name : Text;
        // Other user metadata if needed
    };

    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    var userProfiles = principalMap.empty<UserProfile>();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        principalMap.get(userProfiles, caller);
    };

    public query func getUserProfile(user : Principal) : async ?UserProfile {
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    // Blog post type
    public type BlogPost = {
        id : Nat;
        title : Text;
        content : Text;
        timestamp : Time.Time;
        author : Principal;
    };

    // Web link type
    public type WebLink = {
        id : Nat;
        title : Text;
        url : Text;
        description : Text;
    };

    // Caffeine info type
    public type CaffeineInfo = {
        content : Text;
        lastUpdated : Time.Time;
    };

    // Initialize OrderedMap operations
    transient let natMap = OrderedMap.Make<Nat>(Nat.compare);

    // Blog posts storage
    var blogPosts = natMap.empty<BlogPost>();
    var nextBlogPostId : Nat = 0;

    // Web links storage
    var webLinks = natMap.empty<WebLink>();
    var nextWebLinkId : Nat = 0;

    // Web links order storage
    var webLinksOrder : [Nat] = [];

    // Caffeine info storage
    var caffeineInfo : ?CaffeineInfo = null;

    // Blog post management
    public shared ({ caller }) func addBlogPost(title : Text, content : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add blog posts");
        };

        let post : BlogPost = {
            id = nextBlogPostId;
            title;
            content;
            timestamp = Time.now();
            author = caller;
        };

        blogPosts := natMap.put(blogPosts, nextBlogPostId, post);
        nextBlogPostId += 1;
    };

    public shared ({ caller }) func editBlogPost(id : Nat, title : Text, content : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can edit blog posts");
        };

        switch (natMap.get(blogPosts, id)) {
            case null { Debug.trap("Blog post not found") };
            case (?existingPost) {
                let updatedPost : BlogPost = {
                    id;
                    title;
                    content;
                    timestamp = Time.now();
                    author = existingPost.author;
                };
                blogPosts := natMap.put(blogPosts, id, updatedPost);
            };
        };
    };

    public shared ({ caller }) func deleteBlogPost(id : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can delete blog posts");
        };
        blogPosts := natMap.delete(blogPosts, id);
    };

    public query func getAllBlogPosts() : async [BlogPost] {
        var posts = List.nil<BlogPost>();
        for ((_, post) in natMap.entries(blogPosts)) {
            posts := List.push(post, posts);
        };
        List.toArray(posts);
    };

    // Web links management
    public shared ({ caller }) func addWebLink(title : Text, url : Text, description : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add web links");
        };

        let link : WebLink = {
            id = nextWebLinkId;
            title;
            url;
            description;
        };

        webLinks := natMap.put(webLinks, nextWebLinkId, link);
        webLinksOrder := Array.append(webLinksOrder, [nextWebLinkId]);
        nextWebLinkId += 1;
    };

    public shared ({ caller }) func editWebLink(id : Nat, title : Text, url : Text, description : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can edit web links");
        };

        switch (natMap.get(webLinks, id)) {
            case null { Debug.trap("Web link not found") };
            case (?_) {
                let updatedLink : WebLink = {
                    id;
                    title;
                    url;
                    description;
                };
                webLinks := natMap.put(webLinks, id, updatedLink);
            };
        };
    };

    public shared ({ caller }) func deleteWebLink(id : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can delete web links");
        };
        webLinks := natMap.delete(webLinks, id);
        webLinksOrder := Array.filter(webLinksOrder, func(x : Nat) : Bool { x != id });
    };

    public query func getAllWebLinks() : async [WebLink] {
        var links = List.nil<WebLink>();
        for ((_, link) in natMap.entries(webLinks)) {
            links := List.push(link, links);
        };
        List.toArray(links);
    };

    // New function to reorder web links
    public shared ({ caller }) func reorderWebLinks(newOrder : [Nat]) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can reorder web links");
        };

        var newWebLinks = natMap.empty<WebLink>();

        for (id in newOrder.vals()) {
            switch (natMap.get(webLinks, id)) {
                case null {
                    Debug.trap("Invalid web link ID in new order");
                };
                case (?link) {
                    newWebLinks := natMap.put(newWebLinks, id, link);
                };
            };
        };

        webLinks := newWebLinks;
        webLinksOrder := newOrder;
    };

    // New function to get web links in current order
    public query func getOrderedWebLinks() : async [WebLink] {
        var orderedLinks = List.nil<WebLink>();
        for (id in webLinksOrder.vals()) {
            switch (natMap.get(webLinks, id)) {
                case null {};
                case (?link) {
                    orderedLinks := List.push(link, orderedLinks);
                };
            };
        };
        List.toArray(orderedLinks);
    };

    // Caffeine info management
    public shared ({ caller }) func updateCaffeineInfo(content : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update caffeine info");
        };

        caffeineInfo := ?{
            content;
            lastUpdated = Time.now();
        };
    };

    public query func getCaffeineInfo() : async ?CaffeineInfo {
        caffeineInfo;
    };

    // Get all current admin principals
    public query func getAllAdminPrincipals() : async [Principal] {
        var admins = List.nil<Principal>();
        for ((principal, role) in principalMap.entries(accessControlState.userRoles)) {
            if (role == #admin) {
                admins := List.push(principal, admins);
            };
        };
        List.toArray(admins);
    };

    // Site visit counter
    var visitCount : Nat = 0;

    public shared func incrementVisitCount() : async () {
        visitCount += 1;
    };

    public query func getVisitCount() : async Nat {
        visitCount;
    };
};


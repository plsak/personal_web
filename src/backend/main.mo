import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";



actor {
    // ── Access control ────────────────────────────────────────────────────────

    public type UserRole = AccessControl.UserRole;

    let accessControlState = AccessControl.initState();

    // First caller becomes admin; subsequent callers get a user role.
    // AccessControl.initialize handles "first caller = admin" internally.
    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async UserRole {
        switch (accessControlState.userRoles.get(caller)) {
            case (?role) role;
            case null #guest;
        };
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        switch (accessControlState.userRoles.get(caller)) {
            case (?(#admin)) true;
            case _ false;
        };
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : UserRole) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: only admins can assign roles");
        };
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    func isAdmin(principal : Principal) : Bool {
        switch (accessControlState.userRoles.get(principal)) {
            case (?(#admin)) true;
            case _ false;
        };
    };

    // ── User profiles ─────────────────────────────────────────────────────────

    public type UserProfile = {
        name : Text;
    };

    let userProfiles = Map.empty<Principal, UserProfile>();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        userProfiles.get(caller);
    };

    public query func getUserProfile(user : Principal) : async ?UserProfile {
        userProfiles.get(user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        userProfiles.add(caller, profile);
    };

    // ── Blog posts ────────────────────────────────────────────────────────────

    public type BlogPost = {
        id : Nat;
        title : Text;
        content : Text;
        timestamp : Time.Time;
        author : Principal;
    };

    let blogPosts = Map.empty<Nat, BlogPost>();
    var nextBlogPostId : Nat = 0;

    public shared ({ caller }) func addBlogPost(title : Text, content : Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can add blog posts");
        };
        let post : BlogPost = {
            id = nextBlogPostId;
            title;
            content;
            timestamp = Time.now();
            author = caller;
        };
        blogPosts.add(nextBlogPostId, post);
        nextBlogPostId += 1;
    };

    public shared ({ caller }) func editBlogPost(id : Nat, title : Text, content : Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can edit blog posts");
        };
        switch (blogPosts.get(id)) {
            case null { Runtime.trap("Blog post not found") };
            case (?existingPost) {
                blogPosts.add(id, {
                    id;
                    title;
                    content;
                    timestamp = Time.now();
                    author = existingPost.author;
                });
            };
        };
    };

    public shared ({ caller }) func deleteBlogPost(id : Nat) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can delete blog posts");
        };
        blogPosts.remove(id);
    };

    public query func getAllBlogPosts() : async [BlogPost] {
        let posts = List.empty<BlogPost>();
        for ((_, post) in blogPosts.entries()) {
            posts.add(post);
        };
        posts.toArray();
    };

    // ── Web links ─────────────────────────────────────────────────────────────

    public type WebLink = {
        id : Nat;
        title : Text;
        url : Text;
        description : Text;
    };

    var webLinks = Map.empty<Nat, WebLink>();
    var nextWebLinkId : Nat = 0;
    var webLinksOrder : [Nat] = [];

    public shared ({ caller }) func addWebLink(title : Text, url : Text, description : Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can add web links");
        };
        let link : WebLink = {
            id = nextWebLinkId;
            title;
            url;
            description;
        };
        webLinks.add(nextWebLinkId, link);
        let buf = List.empty<Nat>();
        for (id in webLinksOrder.vals()) { buf.add(id) };
        buf.add(nextWebLinkId);
        webLinksOrder := buf.toArray();
        nextWebLinkId += 1;
    };

    public shared ({ caller }) func editWebLink(id : Nat, title : Text, url : Text, description : Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can edit web links");
        };
        switch (webLinks.get(id)) {
            case null { Runtime.trap("Web link not found") };
            case (?_) {
                webLinks.add(id, { id; title; url; description });
            };
        };
    };

    public shared ({ caller }) func deleteWebLink(id : Nat) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can delete web links");
        };
        webLinks.remove(id);
        webLinksOrder := webLinksOrder.filter(func(x : Nat) : Bool { x != id });
    };

    public query func getAllWebLinks() : async [WebLink] {
        let links = List.empty<WebLink>();
        for ((_, link) in webLinks.entries()) {
            links.add(link);
        };
        links.toArray();
    };

    public shared ({ caller }) func reorderWebLinks(newOrder : [Nat]) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can reorder web links");
        };
        let newWebLinks = Map.empty<Nat, WebLink>();
        for (id in newOrder.vals()) {
            switch (webLinks.get(id)) {
                case null { Runtime.trap("Invalid web link ID in new order") };
                case (?link) { newWebLinks.add(id, link) };
            };
        };
        webLinks := newWebLinks;
        webLinksOrder := newOrder;
    };

    public query func getOrderedWebLinks() : async [WebLink] {
        let orderedLinks = List.empty<WebLink>();
        for (id in webLinksOrder.vals()) {
            switch (webLinks.get(id)) {
                case null {};
                case (?link) { orderedLinks.add(link) };
            };
        };
        orderedLinks.toArray();
    };

    // ── Caffeine info ─────────────────────────────────────────────────────────

    public type CaffeineInfo = {
        content : Text;
        lastUpdated : Time.Time;
    };

    var caffeineInfo : ?CaffeineInfo = null;

    public shared ({ caller }) func updateCaffeineInfo(content : Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can update caffeine info");
        };
        caffeineInfo := ?{ content; lastUpdated = Time.now() };
    };

    public query func getCaffeineInfo() : async ?CaffeineInfo {
        caffeineInfo;
    };

    // ── CaffeineInfo screens ──────────────────────────────────────────────────

    public type CaffeineInfoScreenRecord = {
        id : Text;
        title : Text;
        content : Text;
        order : Nat;
    };

    let caffeineInfoScreens = Map.empty<Text, CaffeineInfoScreenRecord>();
    var caffeineInfoSectionTitle : Text = "About";

    public shared ({ caller }) func updateCaffeineInfoConfig(sectionTitle : Text, screens : [CaffeineInfoScreenRecord]) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can update caffeine info config");
        };
        caffeineInfoSectionTitle := sectionTitle;
        // Clear existing screens
        let existingIds = List.empty<Text>();
        for ((id, _) in caffeineInfoScreens.entries()) {
            existingIds.add(id);
        };
        for (id in existingIds.toArray().vals()) {
            caffeineInfoScreens.remove(id);
        };
        // Add new screens
        for (screen in screens.vals()) {
            caffeineInfoScreens.add(screen.id, screen);
        };
    };

    public query func getCaffeineInfoConfig() : async { sectionTitle : Text; screens : [CaffeineInfoScreenRecord] } {
        let screenList = List.empty<CaffeineInfoScreenRecord>();
        for ((_, screen) in caffeineInfoScreens.entries()) {
            screenList.add(screen);
        };
        {
            sectionTitle = caffeineInfoSectionTitle;
            screens = screenList.toArray();
        };
    };

    // ── Admin management ──────────────────────────────────────────────────────

    public query func getAllAdminPrincipals() : async [Principal] {
        let admins = List.empty<Principal>();
        for ((principal, role) in accessControlState.userRoles.entries()) {
            if (role == #admin) {
                admins.add(principal);
            };
        };
        admins.toArray();
    };

    // ── Visit counter ─────────────────────────────────────────────────────────

    var visitCount : Nat = 0;

    public shared func incrementVisitCount() : async () {
        visitCount += 1;
    };

    public query func getVisitCount() : async Nat {
        visitCount;
    };

    // ── Heading config ────────────────────────────────────────────────────────

    public type HeadingConfig = {
        text : Text;
        font : Text;
        color : Text;
    };

    var headingConfig : HeadingConfig = {
        text = "plsak with caffeine.ai";
        font = "default";
        color = "#ffffff";
    };

    public query func getHeadingConfig() : async HeadingConfig {
        headingConfig;
    };

    public shared ({ caller }) func updateHeadingConfig(text : Text, font : Text, color : Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can update heading config");
        };
        headingConfig := { text; font; color };
    };
};

import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";






actor Self {
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

    // ── Canister IDs ──────────────────────────────────────────────────────────

    stable var frontendCanisterId : Text = "";

    public shared query func getBackendCanisterId() : async Text {
        Principal.fromActor(Self).toText();
    };

    public shared query func getFrontendCanisterId() : async Text {
        frontendCanisterId;
    };

    public shared ({ caller }) func setFrontendCanisterId(id : Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can set frontend canister ID");
        };
        frontendCanisterId := id;
    };

    // ── Section names ─────────────────────────────────────────────────────────

    stable var sectionNameAbout : Text = "About";
    stable var sectionNameBlog : Text = "Blog";
    stable var sectionNameLinks : Text = "Links";
    // ── Section order & visibility ───────────────────────────────────────────

    stable var sectionOrder : [Text] = ["about", "links", "blog"];
    stable var sectionVisibilityAbout : Bool = true;
    stable var sectionVisibilityBlog : Bool = true;
    stable var sectionVisibilityLinks : Bool = true;

    public shared query func getSectionOrder() : async [Text] {
        sectionOrder;
    };

    public shared ({ caller }) func setSectionOrder(order : [Text]) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can set section order");
        };
        if (order.size() != 3) {
            Runtime.trap("Section order must contain exactly 3 items");
        };
        let valid = ["about", "links", "blog"];
        for (item in order.vals()) {
            let found = valid.filter(func(v : Text) : Bool { v == item });
            if (found.size() == 0) {
                Runtime.trap("Invalid section name: " # item);
            };
        };
        sectionOrder := order;
    };

    public shared query func getSectionVisibility() : async { about : Bool; blog : Bool; links : Bool } {
        { about = sectionVisibilityAbout; blog = sectionVisibilityBlog; links = sectionVisibilityLinks };
    };

    public shared ({ caller }) func setSectionVisibility(visibility : { about : Bool; blog : Bool; links : Bool }) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can set section visibility");
        };
        sectionVisibilityAbout := visibility.about;
        sectionVisibilityBlog := visibility.blog;
        sectionVisibilityLinks := visibility.links;
    };

    public shared query func getSectionNames() : async { about : Text; blog : Text; links : Text } {
        { about = sectionNameAbout; blog = sectionNameBlog; links = sectionNameLinks };
    };

    public shared ({ caller }) func setSectionName(section : Text, name : Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can set section names");
        };
        if (section == "about") { sectionNameAbout := name }
        else if (section == "blog") { sectionNameBlog := name }
        else if (section == "links") { sectionNameLinks := name }
        else { Runtime.trap("Unknown section: " # section) };
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
        mediaUrl : ?Text;
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

    public shared ({ caller }) func reorderCaffeineInfoScreens(newOrder : [Text]) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can reorder info screens");
        };
        for (i in newOrder.keys()) {
            let id = newOrder[i];
            switch (caffeineInfoScreens.get(id)) {
                case null { Runtime.trap("Invalid info screen ID in new order: " # id) };
                case (?screen) {
                    caffeineInfoScreens.add(id, { screen with order = i });
                };
            };
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

    stable var visitCount : Nat = 0;

    public shared func incrementVisitCount() : async () {
        visitCount += 1;
    };

    public query func getVisitCount() : async Nat {
        visitCount;
    };
    // ── Site statistics ───────────────────────────────────────────────────────

    public type SiteStatistics = {
        visitCount : Nat;
        linksCount : Nat;
        blogPostsCount : Nat;
        infoScreensCount : Nat;
        backendCanisterId : Text;
    };

    public query func getSiteStatistics() : async SiteStatistics {
        {
            visitCount;
            linksCount = webLinks.size();
            blogPostsCount = blogPosts.size();
            infoScreensCount = caffeineInfoScreens.size();
            backendCanisterId = Principal.fromActor(Self).toText();
        };
    };

    // ── Heading config ────────────────────────────────────────────────────────

    public type HeadingConfig = {
        text : Text;
        font : Text;
        color : Text;
        backgroundColor : ?Text;
        backgroundImageUrl : ?Text;
    };

    var headingConfig : HeadingConfig = {
        text = "";
        font = "default";
        color = "#ffffff";
        backgroundColor = null;
        backgroundImageUrl = null;
    };

    public type BackgroundConfig = {
        pageBackgroundColor : ?Text;
        pageBackgroundImageUrl : ?Text;
        aboutCardColor : ?Text;
        aboutCardImageUrl : ?Text;
        blogCardColor : ?Text;
        blogCardImageUrl : ?Text;
        linksCardColor : ?Text;
        linksCardImageUrl : ?Text;
    };

    var backgroundConfig : BackgroundConfig = {
        pageBackgroundColor = null;
        pageBackgroundImageUrl = null;
        aboutCardColor = null;
        aboutCardImageUrl = null;
        blogCardColor = null;
        blogCardImageUrl = null;
        linksCardColor = null;
        linksCardImageUrl = null;
    };

    public query func getHeadingConfig() : async HeadingConfig {
        headingConfig;
    };

    public shared ({ caller }) func updateHeadingConfig(text : Text, font : Text, color : Text, backgroundColor : ?Text, backgroundImageUrl : ?Text) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can update heading config");
        };
        headingConfig := { text; font; color; backgroundColor; backgroundImageUrl };
    };

    public query func getBackgroundConfig() : async BackgroundConfig {
        backgroundConfig;
    };

    public shared ({ caller }) func updateBackgroundConfig(config : BackgroundConfig) : async () {
        if (not isAdmin(caller)) {
            Runtime.trap("Unauthorized: Only admins can update background config");
        };
        backgroundConfig := config;
    };
};

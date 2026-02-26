export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const Time = IDL.Int;
  const BlogPost = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'content' : IDL.Text,
    'author' : IDL.Principal,
    'timestamp' : Time,
  });
  const WebLink = IDL.Record({
    'id' : IDL.Nat,
    'url' : IDL.Text,
    'title' : IDL.Text,
    'description' : IDL.Text,
  });
  const CaffeineInfo = IDL.Record({
    'content' : IDL.Text,
    'lastUpdated' : Time,
  });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  return IDL.Service({
    'addBlogPost' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'addWebLink' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'deleteBlogPost' : IDL.Func([IDL.Nat], [], []),
    'deleteWebLink' : IDL.Func([IDL.Nat], [], []),
    'editBlogPost' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [], []),
    'editWebLink' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text, IDL.Text], [], []),
    'getAllAdminPrincipals' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getAllBlogPosts' : IDL.Func([], [IDL.Vec(BlogPost)], ['query']),
    'getAllWebLinks' : IDL.Func([], [IDL.Vec(WebLink)], ['query']),
    'getCaffeineInfo' : IDL.Func([], [IDL.Opt(CaffeineInfo)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getOrderedWebLinks' : IDL.Func([], [IDL.Vec(WebLink)], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'getVisitCount' : IDL.Func([], [IDL.Nat], ['query']),
    'incrementVisitCount' : IDL.Func([], [], []),
    'initializeAccessControl' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'reorderWebLinks' : IDL.Func([IDL.Vec(IDL.Nat)], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'updateCaffeineInfo' : IDL.Func([IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };

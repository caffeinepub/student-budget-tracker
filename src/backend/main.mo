import Float "mo:core/Float";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type SharedExpense = {
    amount : Float;
    description : Text;
    splitType : SplitType;
    groupId : Text;
  };

  public type SplitType = {
    #equal;
    #custom : [(Principal, Float)];
  };

  module SharedExpense {
    public func compare(a : SharedExpense, b : SharedExpense) : Order.Order {
      Text.compare(a.description, b.description);
    };

    public func compareByGroup(a : SharedExpense, b : SharedExpense) : Order.Order {
      Text.compare(a.groupId, b.groupId);
    };
  };

  public type Expense = {
    amount : Float;
    category : Text;
    date : Text;
    note : Text;
  };

  module Expense {
    public func compare(a : Expense, b : Expense) : Order.Order {
      Text.compare(a.date, b.date);
    };

    public func compareByCategory(a : Expense, b : Expense) : Order.Order {
      Text.compare(a.category, b.category);
    };
  };

  public type UserProfile = {
    name : Text;
    age : Nat;
    gender : Text;
    course : Text;
    livingSituation : Text;
  };

  module UserProfile {
    public func compare(a : UserProfile, b : UserProfile) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  public type FinancialSurvey = {
    incomeSource : Text;
    incomeRange : Text;
    financialHabits : Text;
    stressLevel : Nat;
    emergencySavings : Bool;
    sharedExpenseBehavior : Text;
    biggestProblem : Text;
  };

  module FinancialSurvey {
    public func compare(a : FinancialSurvey, b : FinancialSurvey) : Order.Order {
      Text.compare(a.incomeSource, b.incomeSource);
    };
  };

  public type Budget = {
    category : Text;
    monthlyLimit : Float;
  };

  module Budget {
    public func compare(a : Budget, b : Budget) : Order.Order {
      Text.compare(a.category, b.category);
    };
  };

  public type Settlement = {
    payer : Principal;
    amount : Float;
    paid : Bool;
    description : Text;
  };

  module Settlement {
    public func compare(a : Settlement, b : Settlement) : Order.Order {
      Text.compare(a.description, b.description);
    };

    public func compareByPayer(a : Settlement, b : Settlement) : Order.Order {
      Principal.compare(a.payer, b.payer);
    };
  };

  public type ExpenseGroup = {
    name : Text;
    members : [Principal];
  };

  module ExpenseGroup {
    public func compare(a : ExpenseGroup, b : ExpenseGroup) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  let categories = List.fromArray(["Food", "Transport", "Books", "Entertainment", "Shopping", "Rent", "Miscellaneous"]);

  let profiles = Map.empty<Principal, UserProfile>();
  let surveys = Map.empty<Principal, FinancialSurvey>();
  let expenses = Map.empty<Principal, List.List<Expense>>();
  let budgets = Map.empty<Principal, Map.Map<Text, Budget>>();
  let groups = Map.empty<Text, ExpenseGroup>();
  let sharedExpenses = Map.empty<Text, List.List<SharedExpense>>();
  let settlements = Map.empty<Text, List.List<Settlement>>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  // Profile and Survey Ops
  public shared ({ caller }) func createOrUpdateProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update profiles");
    };
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public shared ({ caller }) func submitSurvey(survey : FinancialSurvey) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit surveys");
    };
    surveys.add(caller, survey);
  };

  public query ({ caller }) func getSurvey() : async ?FinancialSurvey {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view surveys");
    };
    surveys.get(caller);
  };

  // Expense Ops
  public shared ({ caller }) func addExpense(expense : Expense) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };
    let userExpenses = switch (expenses.get(caller)) {
      case (?existing) { existing };
      case (null) { List.empty<Expense>() };
    };
    userExpenses.add(expense);
    expenses.add(caller, userExpenses);
  };

  public query ({ caller }) func getExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let userExpenses = switch (expenses.get(caller)) {
      case (?existing) { existing };
      case (null) { List.empty<Expense>() };
    };
    userExpenses.toArray().sort();
  };

  // Category Ops
  public shared ({ caller }) func addCustomCategory(category : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add custom categories");
    };
    categories.add(category);
  };

  public query ({ caller }) func getCategories() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view categories");
    };
    categories.toArray();
  };

  // Budget Ops
  public shared ({ caller }) func setBudget(category : Text, limit : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set budgets");
    };
    let userBudgets = switch (budgets.get(caller)) {
      case (?existing) { existing };
      case (null) { Map.empty<Text, Budget>() };
    };
    userBudgets.add(category, { category; monthlyLimit = limit });
    budgets.add(caller, userBudgets);
  };

  public query ({ caller }) func getBudgets() : async [Budget] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view budgets");
    };
    switch (budgets.get(caller)) {
      case (?userBudgets) {
        userBudgets.values().toArray().sort();
      };
      case (null) { [] };
    };
  };

  // Helper function to check group membership
  private func isGroupMember(groupId : Text, user : Principal) : Bool {
    switch (groups.get(groupId)) {
      case (?group) {
        group.members.find<Principal>(func(m) { Principal.equal(m, user) }) != null;
      };
      case (null) { false };
    };
  };

  // Shared Expense Group Ops
  public shared ({ caller }) func createGroup(id : Text, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create groups");
    };
    let group : ExpenseGroup = { name; members = [caller] };
    groups.add(id, group);
  };

  public shared ({ caller }) func addMember(groupId : Text, member : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add members");
    };
    if (not isGroupMember(groupId, caller)) {
      Runtime.trap("Unauthorized: Only group members can add new members");
    };
    switch (groups.get(groupId)) {
      case (?group) {
        let newMembers = group.members.concat([member]);
        groups.add(groupId, { name = group.name; members = newMembers });
      };
      case (null) { Runtime.trap("Group not found") };
    };
  };

  public shared ({ caller }) func removeMember(groupId : Text, member : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove members");
    };
    if (not isGroupMember(groupId, caller)) {
      Runtime.trap("Unauthorized: Only group members can remove members");
    };
    switch (groups.get(groupId)) {
      case (?group) {
        let newMembers = group.members.filter(func(m) { not Principal.equal(m, member) });
        groups.add(groupId, { name = group.name; members = newMembers });
      };
      case (null) { Runtime.trap("Group not found") };
    };
  };

  public query ({ caller }) func getUserGroups() : async [ExpenseGroup] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view groups");
    };
    let allGroups = groups.values().toArray();
    allGroups.filter<ExpenseGroup>(func(group) {
      group.members.find<Principal>(func(m) { Principal.equal(m, caller) }) != null;
    });
  };

  public shared ({ caller }) func addSharedExpense(
    groupId : Text,
    amount : Float,
    description : Text,
    splitType : SplitType,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add shared expenses");
    };
    if (not isGroupMember(groupId, caller)) {
      Runtime.trap("Unauthorized: Only group members can add expenses");
    };

    let expense : SharedExpense = {
      amount;
      description;
      splitType;
      groupId;
    };

    let groupExpenses = switch (sharedExpenses.get(groupId)) {
      case (?existing) { existing };
      case (null) { List.empty<SharedExpense>() };
    };
    groupExpenses.add(expense);
    sharedExpenses.add(groupId, groupExpenses);
  };

  public query ({ caller }) func getGroupExpenses(groupId : Text) : async [SharedExpense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view group expenses");
    };
    if (not isGroupMember(groupId, caller)) {
      Runtime.trap("Unauthorized: Only group members can view expenses");
    };
    switch (sharedExpenses.get(groupId)) {
      case (?expenses) { expenses.toArray().sort() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func markSettlementPaid(groupId : Text, settlementIndex : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark settlements as paid");
    };
    if (not isGroupMember(groupId, caller)) {
      Runtime.trap("Unauthorized: Only group members can mark settlements as paid");
    };
    switch (settlements.get(groupId)) {
      case (?groupSettlements) {
        let settlementsArray = groupSettlements.toArray();
        if (settlementIndex >= settlementsArray.size()) {
          Runtime.trap("Settlement index out of bounds");
        };
        let settlement = settlementsArray[settlementIndex];
        if (not Principal.equal(settlement.payer, caller)) {
          Runtime.trap("Unauthorized: Only the payer can mark settlement as paid");
        };
        let updatedSettlement = {
          payer = settlement.payer;
          amount = settlement.amount;
          paid = true;
          description = settlement.description;
        };
        let newSettlements = List.fromArray<Settlement>(Array.tabulate(settlementsArray.size(), func(i) {
          if (i == settlementIndex) { updatedSettlement } else { settlementsArray[i] };
        }));
        settlements.add(groupId, newSettlements);
      };
      case (null) { Runtime.trap("No settlements found for group") };
    };
  };
};

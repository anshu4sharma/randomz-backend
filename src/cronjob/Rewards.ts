import Users from "../model/UserSchema";

export default class RewardUser {
  static CHECK_EVERY_FIVE_MINUTES = async () => {
    // cron.schedule("*/5 * * * *", () => {
    const data = await Users.find({
      referedBy: { $ne: "" },
    });
    // cron.schedule("*/4 * * * * *", () => {
    //   console.log(RewardAmount.REWARD_FOR_A_PURCHASE_AMOUNT);
    //   console.log("running a task every five minutes");
    // });
  };
};

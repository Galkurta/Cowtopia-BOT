const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
const colors = require("colors");

class CowTopia {
  constructor() {
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/json",
      Origin: "https://cowtopia-prod.tonfarmer.com",
      Referer: "https://cowtopia-prod.tonfarmer.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
      "X-Chain-Id": "43113",
      "X-Lang": "en",
      "X-Os": "miniapp",
    };
    this.totalCoinBalance = 0;
  }

  sanitizeHeader(header) {
    return header.trim().replace(/[\r\n]+/g, "");
  }

  formatNumber(number) {
    return number.toLocaleString("en-US");
  }

  log(msg, color = "white") {
    console.log(colors[color](msg));
  }

  printSeparator(char = "=", length = 50, color = "cyan") {
    this.log(char.repeat(length), color);
  }

  printBox(message, color = "cyan") {
    const boxWidth = message.length + 4;
    this.printSeparator("─", boxWidth, color);
    this.log(`│ ${message} │`.padEnd(boxWidth + 1), color);
    this.printSeparator("─", boxWidth, color);
  }

  async generateToken(x_tg_data) {
    const sanitized_tg_data = this.sanitizeHeader(x_tg_data);
    const url = "https://cowtopia-be.tonfarmer.com/auth";
    const headers = { ...this.headers, "X-Tg-Data": sanitized_tg_data };

    try {
      const response = await axios.post(url, {}, { headers, timeout: 10000 });
      if (response.status === 201) {
        const data = response.data.data;
        this.printBox(`🐮 Account ${this.currentAccountNumber} 🐮`);
        this.log(`👤 Username      : ${data.user.username}`.cyan);
        this.log(`🏆 Level         : ${data.user.level}`.cyan);
        this.log(
          `🐄 Cow Balance   : ${this.formatNumber(data.user.token)}`.cyan
        );
        this.log(
          `💰 Coin Balance  : ${this.formatNumber(data.user.money)}`.cyan
        );
        this.totalCoinBalance += data.user.money;
        this.printSeparator();
        return { token: data.access_token, user: data.user };
      } else {
        this.log(`❌ Login failed. Status code: ${response.status}`, "red");
        return null;
      }
    } catch (error) {
      this.log(`❌ Error: ${error.message}`, "red");
      return null;
    }
  }

  async buyAnimal(token) {
    this.printBox("🐄 Processing Cow Purchases 🐄", "yellow");
    const API_GAME_INFO = "https://cowtopia-be.tonfarmer.com/user/game-info?";
    const API_BUY_ANIMAL =
      "https://cowtopia-be.tonfarmer.com/factory/buy-animal";

    try {
      const res = await axios.get(API_GAME_INFO, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const factories = res.data?.data?.factories || [];
      const availableFactories = factories.filter(
        (factory) => factory.animal_count < 5 && factory.lock === false
      );
      const money = res.data?.data?.user?.money || 0;

      if (availableFactories.length > 0) {
        let autoBuy = true;
        let purchaseCounter = availableFactories[0].animal_count;
        const maxPurchases = 5;

        while (autoBuy) {
          if (purchaseCounter >= maxPurchases) {
            autoBuy = false;
            this.log("Maximum purchase limit reached.", "magenta");
            await this.buyLand(token);
          } else if (money >= availableFactories[0].animal_cost) {
            const res = await axios.post(
              API_BUY_ANIMAL,
              {
                index: 1,
                factory: 0,
                factory_id: availableFactories[0].factory_id,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const responseData = res.data?.data;
            if (responseData) {
              this.log(
                `Cow purchased successfully: ${JSON.stringify(responseData)}`,
                "green"
              );
            } else {
              this.log("Purchase failed, no data returned.", "red");
            }
            purchaseCounter++;
          } else {
            this.log("Insufficient balance to buy cows.", "red");
            autoBuy = false;
          }
        }
      } else {
        this.log("No factories available for purchasing cows.", "yellow");
      }
    } catch (error) {
      this.log(`Error during cow purchase: ${error.message}`, "red");
    }
    this.printSeparator("-", 50, "yellow");
  }

  async buyLand(token) {
    this.printBox("🏡 Processing Factory Upgrades 🏡", "yellow");
    const API_GAME_INFO = "https://cowtopia-be.tonfarmer.com/user/game-info?";
    const API_BUY_FACTORY = "https://cowtopia-be.tonfarmer.com/factory/buy";

    try {
      const res = await axios.get(API_GAME_INFO, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const factories = res.data.data.factories;
      const availableFactories = factories.filter(
        (factory) => factory.lock === true
      );
      const money = res.data.data.user.money;

      this.log(`Factories available  : ${availableFactories.length}`);
      this.log(`Current balance      : ${this.formatNumber(money)} coins`);

      if (availableFactories.length > 0) {
        this.log(
          `Upgrade cost         : ${this.formatNumber(
            availableFactories[0].unlockCost
          )} coins`
        );
      }

      if (
        availableFactories.length > 0 &&
        money >= availableFactories[0].unlockCost
      ) {
        this.log("Sufficient funds, unlocking factory...");

        const buyRes = await axios.post(
          API_BUY_FACTORY,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (buyRes.data.success) {
          this.log("Factory unlocked successfully.", "green");
        } else {
          this.log("Failed to unlock factory.", "red");
        }
      } else {
        this.log("Insufficient coins to unlock more factories.", "red");
      }
    } catch (error) {
      this.log(`Error during factory upgrade: ${error.message}`, "red");
    }
    this.printSeparator("-", 50, "yellow");
  }

  async upgradeHouse(token, balanceCow) {
    this.printBox("🏚️ Processing House Upgrades 🏚️", "yellow");
    const API_UPGRADE_HOUSE_GET =
      "https://cowtopia-be.tonfarmer.com/factory/upgrade-house?";
    const API_UPGRADE_HOUSE_POST =
      "https://cowtopia-be.tonfarmer.com/factory/upgrade-house";

    try {
      const getResponse = await axios.get(API_UPGRADE_HOUSE_GET, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (getResponse.data.success) {
        const upgradeInfo = getResponse.data.data;
        const currentLevel = upgradeInfo.level;
        const upgradeCost = upgradeInfo.token_cost;

        this.log(`Current house level : ${currentLevel}`);
        this.log(`Upgrade cost        : ${this.formatNumber(upgradeCost)} COW`);
        this.log(`Current COW balance : ${this.formatNumber(balanceCow)}`);

        if (balanceCow >= upgradeCost) {
          if (currentLevel < 20) {
            const postResponse = await axios.post(
              API_UPGRADE_HOUSE_POST,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (
              (postResponse.status === 200 || postResponse.status === 201) &&
              postResponse.data.success
            ) {
              this.log("House upgraded successfully.", "green");
            } else {
              this.log("House upgrade failed.", "red");
            }
          } else {
            this.log("House has reached the maximum level.", "blue");
          }
        } else {
          this.log("Insufficient COW balance to upgrade house.", "yellow");
        }
      } else {
        this.log("Failed to retrieve house upgrade information.", "red");
      }
    } catch (error) {
      this.log(`Error during house upgrade: ${error.message}`, "red");
    }
    this.printSeparator("-", 50, "yellow");
  }

  async claimOfflineProfit(token) {
    this.printBox("💼 Claiming Offline Profits 💼", "green");
    const url = "https://cowtopia-be.tonfarmer.com/user/offline-profit";
    const headers = { ...this.headers, Authorization: `Bearer ${token}` };

    try {
      const response = await axios.get(url, { headers, timeout: 10000 });
      if (response.status === 200) {
        const data = response.data.data;
        this.log(
          `Profit claimed      : ${this.formatNumber(data.profit)} coins`,
          "green"
        );
      } else {
        this.log(
          `Failed to claim offline profits. Status: ${response.status}`,
          "red"
        );
      }
    } catch (error) {
      this.log(`Error claiming offline profits: ${error.message}`, "red");
    }
    this.printSeparator("-", 50, "green");
  }

  wait(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  }

  async countdownTimer(duration) {
    const frames = [
      "🕐",
      "🕑",
      "🕒",
      "🕓",
      "🕔",
      "🕕",
      "🕖",
      "🕗",
      "🕘",
      "🕙",
      "🕚",
      "🕛",
    ];
    let frameIndex = 0;
    let remainingTime = duration;

    while (remainingTime > 0) {
      process.stdout.write(
        `\r${frames[frameIndex]} Next update in: ${this.formatTime(
          remainingTime
        )}`.cyan
      );
      await this.wait(1000);
      remainingTime -= 1000;
      frameIndex = (frameIndex + 1) % frames.length;
    }
    process.stdout.write("\n");
  }

  async main() {
    console.log("\n🌟 Welcome to CowTopia Auto-Manager! 🌟");
    this.printSeparator("=", 50, "cyan");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const autoBuyAnimal = await new Promise((resolve) => {
      rl.question(
        "🐄 Would you like to automatically buy cows? (Y/N): ".cyan,
        (answer) => {
          resolve(answer.trim().toUpperCase() === "Y");
        }
      );
    });

    const autoBuyFactory = await new Promise((resolve) => {
      rl.question(
        "🏭 Would you like to automatically upgrade home and buy factories? (Y/N): "
          .cyan,
        (answer) => {
          resolve(answer.trim().toUpperCase() === "Y");
          rl.close();
        }
      );
    });

    while (true) {
      const tgDataList = fs
        .readFileSync("data.txt", "utf8")
        .split("\n")
        .filter((line) => line.trim() !== "");

      for (let no = 0; no < tgDataList.length; no++) {
        const tgData = tgDataList[no];
        this.currentAccountNumber = no + 1;
        const tokenData = await this.generateToken(tgData);
        if (tokenData) {
          const { token, user } = tokenData;

          if (autoBuyAnimal) {
            await this.buyAnimal(token);
          }
          if (autoBuyFactory) {
            await this.buyLand(token);
            await this.upgradeHouse(token, user.token);
          }

          await this.claimOfflineProfit(token);
        }
      }

      this.printBox(
        `💰 TOTAL COIN BALANCE: ${this.formatNumber(this.totalCoinBalance)} 💰`,
        "green"
      );

      console.log("\n⏳ Waiting for the next cycle...".yellow);
      await this.countdownTimer(300 * 1000); // 5 minutes countdown
    }
  }
}

const cowTopia = new CowTopia();
cowTopia.main().catch(console.error);

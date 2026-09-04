/**
 * Database Validator — validates ALL questions in the database
 * Run: node server/scripts/_validateDatabase.js
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { validateQuestion, normalizeText } = require("./_questionValidator");
const AptitudeQuestion = require("../models/AptitudeQuestion");

async function validateDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/prepagent", { dbName: process.env.MONGO_DB || "prepagent", serverSelectionTimeoutMS: 15000 });
    console.log("Connected to MongoDB");
    
    const questions = await AptitudeQuestion.find({}).lean();
    console.log("Total questions in DB: " + questions.length);
    
    const report = { total: questions.length, valid: 0, invalid: 0, byError: {}, byCategory: {}, duplicates: [] };
    const seenTexts = new Map();
    
    for (const q of questions) {
      const cat = q.category || "unknown";
      if (!report.byCategory[cat]) report.byCategory[cat] = { total: 0, valid: 0, invalid: 0 };
      report.byCategory[cat].total++;
      
      const result = validateQuestion(q);
      if (result.valid) {
        report.valid++;
        report.byCategory[cat].valid++;
      } else {
        report.invalid++;
        report.byCategory[cat].invalid++;
        result.errors.forEach(e => { report.byError[e] = (report.byError[e] || 0) + 1; });
      }
      
      // Check for duplicate questions
      const normText = normalizeText(q.questionText);
      const key = cat + "|" + q.topic + "|" + q.difficulty + "|" + normText;
      if (seenTexts.has(key)) {
        report.duplicates.push({ id: q._id, topic: q.topic, difficulty: q.difficulty });
      } else {
        seenTexts.set(key, q._id);
      }
    }
    
    console.log("\n=== DATABASE VALIDATION REPORT ===");
    console.log("Total: " + report.total);
    console.log("Valid: " + report.valid);
    console.log("Invalid: " + report.invalid);
    console.log("Duplicates: " + report.duplicates.length);
    console.log("\nBy Error Type:");
    Object.entries(report.byError).sort((a, b) => b[1] - a[1]).forEach(([e, c]) => console.log("  " + e + ": " + c));
    console.log("\nBy Category:");
    Object.entries(report.byCategory).forEach(([c, d]) => console.log("  " + c + ": " + d.valid + "/" + d.total + " valid"));
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) { console.error("Validation error:", err.message); process.exit(1); }
}

validateDatabase();

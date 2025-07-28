"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_ssr_lib_supabase_ts";
exports.ids = ["_ssr_lib_supabase_ts"];
exports.modules = {

/***/ "(ssr)/./lib/supabase.ts":
/*!*************************!*\
  !*** ./lib/supabase.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(ssr)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\nconst supabaseUrl = \"https://djqueobbsqebtfnqysmt.supabase.co\";\nconst supabaseAnonKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcXVlb2Jic3FlYnRmbnF5c210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIyNzQsImV4cCI6MjA2OTE5ODI3NH0.8bUtQl__vruvkxUFcMEWB9IGNU8eZmDQEnDOs9J8i30\";\nif (!supabaseUrl || !supabaseAnonKey) {\n    throw new Error('Missing Supabase credentials. Please check your .env.local file.');\n}\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, supabaseAnonKey);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9saWIvc3VwYWJhc2UudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBb0Q7QUFFcEQsTUFBTUMsY0FBY0MsMENBQW9DO0FBQ3hELE1BQU1HLGtCQUFrQkgsa05BQXlDO0FBRWpFLElBQUksQ0FBQ0QsZUFBZSxDQUFDSSxpQkFBaUI7SUFDcEMsTUFBTSxJQUFJRSxNQUFNO0FBQ2xCO0FBRU8sTUFBTUMsV0FBV1IsbUVBQVlBLENBQUNDLGFBQWFJLGlCQUFnQiIsInNvdXJjZXMiOlsiL1VzZXJzL2d1aWJhZGVybWFubi9Eb2N1bWVudHMvR2l0SHViL2NhcnBsdXMvbGliL3N1cGFiYXNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIlxuXG5jb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTFxuY29uc3Qgc3VwYWJhc2VBbm9uS2V5ID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVlcblxuaWYgKCFzdXBhYmFzZVVybCB8fCAhc3VwYWJhc2VBbm9uS2V5KSB7XG4gIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBTdXBhYmFzZSBjcmVkZW50aWFscy4gUGxlYXNlIGNoZWNrIHlvdXIgLmVudi5sb2NhbCBmaWxlLicpXG59XG5cbmV4cG9ydCBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChzdXBhYmFzZVVybCwgc3VwYWJhc2VBbm9uS2V5KVxuXG4vLyBUaXBvcyBwYXJhIG9zIGRhZG9zIGRvIFN1cGFiYXNlXG5leHBvcnQgdHlwZSBVc2VyID0ge1xuICBpZDogc3RyaW5nXG4gIGVtYWlsOiBzdHJpbmdcbiAgbm9tZTogc3RyaW5nXG4gIHNvYnJlbm9tZTogc3RyaW5nXG4gIHRlbGVmb25lOiBzdHJpbmdcbiAgY3JlYXRlZF9hdDogc3RyaW5nXG59XG5cbmV4cG9ydCB0eXBlIFByb2R1dG8gPSB7XG4gIGlkOiBzdHJpbmdcbiAgbm9tZTogc3RyaW5nXG4gIGNhdGVnb3JpYTogc3RyaW5nXG4gIHByZWNvOiBudW1iZXJcbiAgZGVzY3JpY2FvOiBzdHJpbmdcbiAgaW1hZ2VtX3ByaW5jaXBhbDogc3RyaW5nXG4gIGltYWdlbnM6IHN0cmluZ1tdXG4gIGVzdG9xdWU6IG51bWJlclxuICBjcmVhdGVkX2F0OiBzdHJpbmdcbn1cblxuZXhwb3J0IHR5cGUgUGVkaWRvID0ge1xuICBpZDogc3RyaW5nXG4gIHVzZXJfaWQ6IHN0cmluZ1xuICBzdGF0dXM6IHN0cmluZ1xuICB0b3RhbDogbnVtYmVyXG4gIGNyZWF0ZWRfYXQ6IHN0cmluZ1xufVxuXG5leHBvcnQgdHlwZSBJdGVtUGVkaWRvID0ge1xuICBpZDogc3RyaW5nXG4gIHBlZGlkb19pZDogc3RyaW5nXG4gIHByb2R1dG9faWQ6IHN0cmluZ1xuICBxdWFudGlkYWRlOiBudW1iZXJcbiAgcHJlY29fdW5pdGFyaW86IG51bWJlclxuICBjcmVhdGVkX2F0OiBzdHJpbmdcbn1cblxuZXhwb3J0IHR5cGUgQ2FsY3Vsb1Jlc3VsdGFkbyA9IHtcbiAgaWQ6IHN0cmluZ1xuICB0YW1hbmhvX3JvZGE6IHN0cmluZ1xuICBhbHR1cmE6IHN0cmluZ1xuICBsYXJndXJhOiBzdHJpbmdcbiAgcmVzdWx0YWRvOiBzdHJpbmdcbiAgY3JlYXRlZF9hdDogc3RyaW5nXG59XG4iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50Iiwic3VwYWJhc2VVcmwiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIiwic3VwYWJhc2VBbm9uS2V5IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiLCJFcnJvciIsInN1cGFiYXNlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./lib/supabase.ts\n");

/***/ })

};
;
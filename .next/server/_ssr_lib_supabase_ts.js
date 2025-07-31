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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(ssr)/./node_modules/.pnpm/@supabase+supabase-js@2.53.0/node_modules/@supabase/supabase-js/dist/module/index.js\");\n\nconst supabaseUrl = \"https://djqueobbsqebtfnqysmt.supabase.co\";\nconst supabaseAnonKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcXVlb2Jic3FlYnRmbnF5c210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIyNzQsImV4cCI6MjA2OTE5ODI3NH0.8bUtQl__vruvkxUFcMEWB9IGNU8eZmDQEnDOs9J8i30\";\nif (!supabaseUrl || !supabaseAnonKey) {\n    throw new Error('Missing Supabase credentials. Please check your .env.local file.');\n}\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, supabaseAnonKey);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9saWIvc3VwYWJhc2UudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBb0Q7QUFFcEQsTUFBTUMsY0FBY0MsMENBQW9DO0FBQ3hELE1BQU1HLGtCQUFrQkgsa05BQXlDO0FBRWpFLElBQUksQ0FBQ0QsZUFBZSxDQUFDSSxpQkFBaUI7SUFDcEMsTUFBTSxJQUFJRSxNQUFNO0FBQ2xCO0FBRU8sTUFBTUMsV0FBV1IsbUVBQVlBLENBQUNDLGFBQWFJLGlCQUFnQiIsInNvdXJjZXMiOlsiQzpcXHhhbXBwXFxodGRvY3NcXEdJVEhVQlxcY2FycGx1c1xcbGliXFxzdXBhYmFzZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCJcclxuXHJcbmNvbnN0IHN1cGFiYXNlVXJsID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMXHJcbmNvbnN0IHN1cGFiYXNlQW5vbktleSA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZXHJcblxyXG5pZiAoIXN1cGFiYXNlVXJsIHx8ICFzdXBhYmFzZUFub25LZXkpIHtcclxuICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgU3VwYWJhc2UgY3JlZGVudGlhbHMuIFBsZWFzZSBjaGVjayB5b3VyIC5lbnYubG9jYWwgZmlsZS4nKVxyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlQW5vbktleSlcclxuXHJcbi8vIFRpcG9zIHBhcmEgb3MgZGFkb3MgZG8gU3VwYWJhc2VcclxuZXhwb3J0IHR5cGUgVXNlciA9IHtcclxuICBpZDogc3RyaW5nXHJcbiAgZW1haWw6IHN0cmluZ1xyXG4gIG5vbWU6IHN0cmluZ1xyXG4gIHNvYnJlbm9tZTogc3RyaW5nXHJcbiAgdGVsZWZvbmU6IHN0cmluZ1xyXG4gIGNyZWF0ZWRfYXQ6IHN0cmluZ1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBQcm9kdXRvID0ge1xyXG4gIGlkOiBzdHJpbmdcclxuICBub21lOiBzdHJpbmdcclxuICBjYXRlZ29yaWE6IHN0cmluZ1xyXG4gIHByZWNvOiBudW1iZXJcclxuICBkZXNjcmljYW86IHN0cmluZ1xyXG4gIGltYWdlbV9wcmluY2lwYWw6IHN0cmluZ1xyXG4gIGltYWdlbnM6IHN0cmluZ1tdXHJcbiAgZXN0b3F1ZTogbnVtYmVyXHJcbiAgY3JlYXRlZF9hdDogc3RyaW5nXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFBlZGlkbyA9IHtcclxuICBpZDogc3RyaW5nXHJcbiAgdXNlcl9pZDogc3RyaW5nXHJcbiAgc3RhdHVzOiBzdHJpbmdcclxuICB0b3RhbDogbnVtYmVyXHJcbiAgY3JlYXRlZF9hdDogc3RyaW5nXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEl0ZW1QZWRpZG8gPSB7XHJcbiAgaWQ6IHN0cmluZ1xyXG4gIHBlZGlkb19pZDogc3RyaW5nXHJcbiAgcHJvZHV0b19pZDogc3RyaW5nXHJcbiAgcXVhbnRpZGFkZTogbnVtYmVyXHJcbiAgcHJlY29fdW5pdGFyaW86IG51bWJlclxyXG4gIGNyZWF0ZWRfYXQ6IHN0cmluZ1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBDYWxjdWxvUmVzdWx0YWRvID0ge1xyXG4gIGlkOiBzdHJpbmdcclxuICB0YW1hbmhvX3JvZGE6IHN0cmluZ1xyXG4gIGFsdHVyYTogc3RyaW5nXHJcbiAgbGFyZ3VyYTogc3RyaW5nXHJcbiAgcmVzdWx0YWRvOiBzdHJpbmdcclxuICBjcmVhdGVkX2F0OiBzdHJpbmdcclxufVxyXG4iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50Iiwic3VwYWJhc2VVcmwiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIiwic3VwYWJhc2VBbm9uS2V5IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiLCJFcnJvciIsInN1cGFiYXNlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./lib/supabase.ts\n");

/***/ })

};
;
export default function asyncHandler(controller) {
  return function wrappedController(request, response, next) {
    Promise.resolve(
      controller(request, response, next)
    ).catch(next);
  };
}
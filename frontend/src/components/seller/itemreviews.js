import { FaStar } from "react-icons/fa";
import { format } from "date-fns-tz";

const ItemReviews = ({ item, reviews }) => {

    return (
        <div className="flex flex-col w-[22rem]">
            <div className="flex justify-center flex-col">
                {/* Item Picture */}
                <div className="flex justify-center mb-3">
                    <div className="w-40 h-40 bg-indigo-500 text-white text-6xl font-bold
                                rounded-lg overflow-hidden flex items-center justify-center relative">
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={`${item.name}`}
                                className="object-cover w-full h-full"
                                />
                        ) : (
                            `${item.name.charAt(0).toUpperCase()}`
                        )}
                    </div>
                </div>
                <h1 className="font-semibold text-xl text-center flex flex-row items-center justify-center mb-4">
                    {item.name}
                    {item?.averageRating ? (<>
                    <p className="text-yellow-400 ml-2 text-lg"><FaStar /></p>
                    <p className="text-lg">{item?.averageRating.toFixed(1)}</p> </>
                    ) : (
                        <p className="text-lg"></p>
                    )}
                </h1>
            </div>
            <div className="space-y-4">
                {reviews.length > 0 ? (
                    reviews
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((review) => (
                        <div key={review._id} className="bg-white p-4 rounded-lg">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="flex-shrink-0 bg-indigo-500 text-white">
                                    {review.customerId.profile_picture ? (
                                        <img
                                        className="h-12 w-12 rounded-full"
                                        src={review.customerId.profile_picture}
                                        alt={review.customerId.username}
                                    />
                                    ) : (
                                        `${review.customerId.username.charAt(0).toUpperCase()}`
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-md font-semibold">{review.customerId.username}</h2>
                                    <p className="text-xs text-gray-500">Order #{review.orderId.orderNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center mb-2 flex items-center">
                                <span className="text-sm flex flex-row">
                                {[...Array(review.rating)].map((_, i) => (
                                    <FaStar key={i} className="text-yellow-400" />
                                ))}
                                {[...Array(5 - review.rating)].map((_, i) => (
                                    <FaStar key={i} className="text-gray-300" />
                                ))}
                                </span>
                                <p className="text-xs ml-2">
                                    {format(new Date(review.createdAt), "MM/dd/yyyy hh:mm a", { timeZone: "Asia/Manila" })}
                                </p>
                            </div>
                            <p className="text-gray-700">{review.review}</p>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center flex-col mt-2">
                        <p className="text-gray-500">No reviews found for this item.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemReviews;
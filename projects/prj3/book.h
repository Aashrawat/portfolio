/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: march29
*/
#ifndef SENECA_BOOK_H
#define SENECA_BOOK_H

#include <string>
#include "mediaItem.h"

namespace seneca
{
    class Book : public MediaItem
    {
        std::string m_author{};
        std::string m_country{};
        double m_price{};

        Book(const std::string& author,
            const std::string& title,
            const std::string& country,
            double price,
            unsigned short year,
            const std::string& summary);

    public:
        void display(std::ostream& out = std::cout) const override;
        static Book* createItem(const std::string& strBook);
    };
}

#endif
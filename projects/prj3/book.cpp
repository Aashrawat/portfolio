/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: march29
*/
#include "book.h"
#include "settings.h"

#include <sstream>
#include <iomanip>
#include <stdexcept>

namespace seneca
{
    Book::Book(const std::string& author,
        const std::string& title,
        const std::string& country,
        double price,
        unsigned short year,
        const std::string& summary)
        : MediaItem(title, summary, year)
        , m_author(author)
        , m_country(country)
        , m_price(price)
    {
    }

    void Book::display(std::ostream& out) const
    {
        if (g_settings.m_tableView)
        {
            out << "B | ";
            out << std::left << std::setfill('.');
            out << std::setw(50) << this->getTitle() << " | ";
            out << std::right << std::setfill(' ');
            out << std::setw(2) << this->m_country << " | ";
            out << std::setw(4) << this->getYear() << " | ";
            out << std::left;
            if (g_settings.m_maxSummaryWidth > -1)
            {
                if (static_cast<short>(this->getSummary().size()) <= g_settings.m_maxSummaryWidth)
                    out << this->getSummary();
                else
                    out << this->getSummary().substr(0, g_settings.m_maxSummaryWidth - 3) << "...";
            }
            else
                out << this->getSummary();
            out << std::endl;
        }
        else
        {
            size_t pos = 0;
            out << this->getTitle() << " [" << this->getYear() << "] [";
            out << m_author << "] [" << m_country << "] [" << m_price << "]\n";
            out << std::setw(this->getTitle().size() + 7) << std::setfill('-') << "" << '\n';
            while (pos < this->getSummary().size())
            {
                out << "    " << this->getSummary().substr(pos, g_settings.m_maxSummaryWidth) << '\n';
                pos += g_settings.m_maxSummaryWidth;
            }
            out << std::setw(this->getTitle().size() + 7) << std::setfill('-') << ""
                << std::setfill(' ') << '\n';
        }
    }

    Book* Book::createItem(const std::string& strBook)
    {
        if (strBook.empty() || strBook[0] == '#')
            throw "Not a valid book.";

        std::string record = strBook;
        std::string fields[6];
        size_t start = 0;

        for (int i = 0; i < 5; ++i)
        {
            size_t comma = record.find(',', start);
            if (comma == std::string::npos)
                throw "Not a valid book.";

            fields[i] = record.substr(start, comma - start);
            trim(fields[i]);
            start = comma + 1;
        }

        fields[5] = record.substr(start);
        trim(fields[5]);

        try
        {
            return new Book(
                fields[0],
                fields[1],
                fields[2],
                std::stod(fields[3]),
                static_cast<unsigned short>(std::stoi(fields[4])),
                fields[5]
            );
        }
        catch (...)
        {
            throw "Not a valid book.";
        }
    }
}
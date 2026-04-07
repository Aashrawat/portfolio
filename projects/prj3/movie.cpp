/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: march29
*/
#include "movie.h"
#include "settings.h"

#include <iomanip>

namespace seneca
{
    Movie::Movie(const std::string& title,
        unsigned short year,
        const std::string& summary)
        : MediaItem(title, summary, year)
    {
    }

    void Movie::display(std::ostream& out) const
    {
        if (g_settings.m_tableView)
        {
            out << "M | ";
            out << std::left << std::setfill('.');
            out << std::setw(50) << this->getTitle() << " | ";
            out << std::right << std::setfill(' ');
            out << std::setw(9) << this->getYear() << " | ";
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
            out << this->getTitle() << " [" << this->getYear() << "]\n";
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

    Movie* Movie::createItem(const std::string& strMovie)
    {
        if (strMovie.empty() || strMovie[0] == '#')
            throw "Not a valid movie.";

        std::string record = strMovie;
        std::string title, yearStr, summary;

        size_t c1 = record.find(',');
        if (c1 == std::string::npos)
            throw "Not a valid movie.";

        size_t c2 = record.find(',', c1 + 1);
        if (c2 == std::string::npos)
            throw "Not a valid movie.";

        title = record.substr(0, c1);
        yearStr = record.substr(c1 + 1, c2 - c1 - 1);
        summary = record.substr(c2 + 1);

        trim(title);
        trim(yearStr);
        trim(summary);

        try
        {
            return new Movie(title,
                static_cast<unsigned short>(std::stoi(yearStr)),
                summary);
        }
        catch (...)
        {
            throw "Not a valid movie.";
        }
    }
}